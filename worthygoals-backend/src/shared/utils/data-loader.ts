
import * as fs from 'fs';
import * as path from 'path';

export class DataLoaderUtil {
    static async loadData(fileName: string): Promise<any> {
        const rootPath = process.cwd();
        const filePath = path.join(rootPath, 'src', fileName);

        try {
            const fileData = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error('Error loading file:', error);
            throw new Error('Could not load data from file');
        }
    }
}
