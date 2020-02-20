import {TemplateData} from "./templateData";
import {buildDocumentPaths, getDocuments, isMicroflow} from "../../sdk";
import {v4 as uuid} from "uuid";
import {microflows, projects} from "mendixmodelsdk";
import {createDocumentFilter, FilterConfig} from "../filter";
import IModule = projects.IModule;
import Microflow = microflows.Microflow;
import {microflowTemplateData} from "./microflow";

export const moduleTemplateData = async (module: IModule, config: FilterConfig): Promise<TemplateData> => {
    const filteredDocuments = getDocuments(module)
        .filter(createDocumentFilter(config.ignorePatterns ?? [], buildDocumentPaths(module)));

    const microflows = await Promise.all(
        filteredDocuments
            .filter(isMicroflow)
            .map(microflowTemplateData));

    return {
        ID: uuid(),
        Name: module.name,
        HasMicroflows: microflows.length > 0,
        Microflows: {
            ID: uuid(),
            TypeName: Microflow.structureTypeName.split("$")[1],
            Microflows: microflows
        }
    };
};
