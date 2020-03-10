import { MendixSdkClient } from "mendixplatformsdk";
import { Argv } from "yargs";
import { OutputArguments, registerOutputOptions } from "../options/output";
import { ProjectArguments, registerProjectOptions } from "../options/project";
import { DefaultProcessor } from "../../documentation/defaultprocessor";
import { registerTemplateOptions, TemplateArguments } from "../options/templates";
import {
	createDocumentTypeFilter,
	createGlobDocumentFilter,
	createRegexModuleFilter
} from "../../documentation/filters";
import { GlobalArguments } from "../cli";
import { FilterArguments, registerFilterOptions } from "../options/filters";
import { defaultTemplateConfig } from "../../documentation/templates";
import { MpkProjectConfig, SvnProjectConfig, WorkingCopyProjectConfig } from "../../sdk/projects";
import { ClientArguments, registerClientOptions } from "../options/client";
import { generateDocumentation } from "../../documentation/generatedocumentation";

interface GenerateCommandArguments
	extends GlobalArguments,
		ClientArguments,
		ProjectArguments,
		FilterArguments,
		TemplateArguments,
		OutputArguments {}

export const registerGenerateCommand = (yargs: Argv) =>
	yargs.command(
		"generate",
		"Generate documentation",
		generateCommandBuilder,
		generateCommandHandler
	);

const generateCommandBuilder = (yargs: Argv) => {
	yargs = registerClientOptions(yargs);
	yargs = registerProjectOptions(yargs);
	yargs = registerFilterOptions(yargs);
	yargs = registerTemplateOptions(yargs);
	yargs = registerOutputOptions(yargs);

	return yargs.argv;
};

const generateCommandHandler = async (args: GenerateCommandArguments) => {
	const client = new MendixSdkClient(args.username, args.apikey);

	const projectConfig = getProjectConfig(args);
	const filterConfig = getFilterConfig(args);
	const templateConfig = getTemplateConfig(args);
	const outputConfig = getOutputConfig(args);

	const moduleFilter = createRegexModuleFilter(new RegExp(filterConfig.modulesRegex));
	const documentFilter = createGlobDocumentFilter(filterConfig.ignorePatterns ?? []);
	const documentTypeFilter = createDocumentTypeFilter(filterConfig.types);

	const processor = new DefaultProcessor(moduleFilter, documentFilter, documentTypeFilter);

	if (!projectConfig) throw new Error("Invalid project configuration");

	await generateDocumentation(client, {
		project: projectConfig,
		filters: filterConfig,
		templates: templateConfig,
		output: outputConfig,
		processor
	});
};

const getProjectConfig = (
	args: GenerateCommandArguments
): MpkProjectConfig | SvnProjectConfig | WorkingCopyProjectConfig | undefined =>
	args.mpk
		? {
				mpk: args.mpk
		  }
		: args.workingcopyid
		? {
				workingCopyId: args.workingcopyid
		  }
		: args.projectid && args.branch && args.revision
		? {
				projectId: args.projectid,
				branch: args.branch,
				revision: args.revision
		  }
		: undefined;

const getFilterConfig = (args: GenerateCommandArguments) => ({
	modulesRegex: args.modules,
	ignorePatterns: args.ignore,
	types: args.types
});

const getTemplateConfig = (args: GenerateCommandArguments) => ({
	directory: args.templateDirectory ?? defaultTemplateConfig.directory,
	extension: args.templateExtension ?? defaultTemplateConfig.extension,
	main: args.templateMain ?? defaultTemplateConfig.main
});

const getOutputConfig = (args: GenerateCommandArguments) => ({
	directory: args.outputDirectory,
	filename: args.outputFilename
});
