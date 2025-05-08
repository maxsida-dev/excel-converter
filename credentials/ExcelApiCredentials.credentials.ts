import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ExcelApiCredentials implements ICredentialType {
    name = 'excelApiCredentials';
    displayName = 'Excel API Credentials';
    documentationUrl = 'https://example.com/docs';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            default: '',
        },
    ];
}