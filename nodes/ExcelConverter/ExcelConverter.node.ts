import { IExecuteFunctions } from 'n8n-core';
import {
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import * as ExcelJS from 'exceljs';

export class ExcelConverter implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Excel Converter',
        name: 'excelConverter',
        icon: 'file:excel.svg',
        group: ['transform'],
        version: 1,
        description: 'Converts array data to Excel file.',
        defaults: {
            name: 'Excel Converter',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Worksheet Name',
                name: 'worksheetName',
                type: 'string',
                default: 'Sheet1',
                description: 'Name of the worksheet',
            },
            {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                description: 'Name of the binary property to which to write the data',
            },
            {
                displayName: 'File Name',
                name: 'fileName',
                type: 'string',
                default: 'data.xlsx',
                description: 'Name of the output file',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                // Get parameters
                const worksheetName = this.getNodeParameter('worksheetName', itemIndex) as string;
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
                const fileName = this.getNodeParameter('fileName', itemIndex) as string;

                // Get the item
                const item = items[itemIndex];
                // Get the data from the item
                const data = item.json.data as Record<string, unknown>[];
                
                if (!Array.isArray(data)) {
                    throw new Error('The data must be an array of objects.');
                }

                // Create a new workbook
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(worksheetName);

                // Define columns with keys
                if (data.length > 0) {
                    const firstObject = data[0];
                    const columns = Object.keys(firstObject).map(key => ({
                        header: key,
                        key: key,
                        width: 20
                    }));
                    
                    worksheet.columns = columns;
                    
                    // Add data rows using objects (ExcelJS will match by key)
                    data.forEach(rowData => {
                        worksheet.addRow(rowData);
                    });
                }

                // Write to buffer
                const buffer = await workbook.xlsx.writeBuffer();

                // Return data
                const newItem: INodeExecutionData = {
                    json: {
                        success: true,
                        rowCount: data.length,
                    },
                    binary: {},
                };

                newItem.binary![binaryPropertyName] = {
                    data: Buffer.from(buffer).toString('base64'),
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    fileName,
                };

                returnData.push(newItem);
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            success: false,
                            error: error.message,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }

        return [returnData];
    }
}



