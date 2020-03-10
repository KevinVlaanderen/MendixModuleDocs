import * as fs from 'fs';
import {MendixSdkClient} from "mendixplatformsdk";
import Mustache from "mustache";
import path from "path";
import {loadTemplates, TemplateConfig} from "./templates";
import {FilterConfig} from "./filters";
import {openWorkingCopy, ProjectConfig} from "../sdk";
import {OutputConfig} from "./output";
import {IModel} from "mendixmodelsdk";

export interface TemplateData {
    [property: string]: string | number | boolean | undefined | TemplateData | Array<TemplateData>;
}

export interface Processor<T extends TemplateData> {
    process: (model: IModel) => Promise<T>;
}

export interface GenerateDocumentationConfig {
    output: OutputConfig;
    filters: FilterConfig;
    templates: TemplateConfig;
    project: ProjectConfig;
    processor: Processor<TemplateData>;
}

export const generateDocumentation = async (client: MendixSdkClient, config: GenerateDocumentationConfig): Promise<void> => {
    const templateConfig = config.templates;
    const workingCopyConfig = config.project;

    const templates = loadTemplates(templateConfig.directory, templateConfig.extension, templateConfig.main);
    const model = await openWorkingCopy(client, workingCopyConfig);

    const templateData = await config.processor.process(model);

    const rendered = Mustache.render(templates.main, templateData, templates.partials);

    if (!fs.existsSync(config.output.directory))
        fs.mkdirSync(config.output.directory);

    fs.writeFileSync(path.join(config.output.directory, config.output.filename), rendered);
};
