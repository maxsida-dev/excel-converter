import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import * as ExcelJS from 'exceljs';

export class ExcelConverter implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Excel Converter',
        name: 'excelConverter',
        icon: 'file:icons/excel.svg',
        group: ['transform'],
        version: 1,
        description: 'Converts JSON string data to Excel file',
        defaults: {
            name: 'Excel Converter',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Input Field',
                name: 'inputField',
                type: 'string',
                default: 'json.data',
                description: 'The name of the field that contains the JSON string data. Example: json.data',
                required: true,
            },
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
        
        try {
            // Get parameters from the first item
            const inputField = this.getNodeParameter('inputField', 0) as string;
            const worksheetName = this.getNodeParameter('worksheetName', 0) as string;
            const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
            const fileName = this.getNodeParameter('fileName', 0) as string;

            // Parse the JSON string directly from inputField
            let data;
            try {
                data = JSON.parse(inputField);
            } catch (error) {
                throw new Error(`Failed to parse JSON string: ${error.message}`);
            }
            
            // Ensure parsed data is an array
            if (!Array.isArray(data)) {
                throw new Error('Parsed JSON data is not an array');
            }
            
            // Ensure we have at least one item and it's an object
            if (data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
                throw new Error('Parsed JSON data must contain at least one object');
            }

            // Create a new workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(worksheetName);

            // Define columns with keys
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

            return [[newItem]];
            
        } catch (error) {
            if (this.continueOnFail()) {
                return [[{
                    json: {
                        success: false,
                        error: error.message,
                    },
                }]];
            }
            throw error;
        }
    }
}








