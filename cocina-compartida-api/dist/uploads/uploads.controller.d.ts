export declare class UploadsController {
    debugUploads(): Promise<{
        uploadsPath: string;
        cwd: string;
        totalFiles: number;
        files: string[];
        error?: undefined;
    } | {
        error: string;
        uploadsPath: string;
        cwd: string;
        totalFiles?: undefined;
        files?: undefined;
    }>;
    uploadRecipeFiles(id: string, files: any[]): Promise<{
        urls: string[];
    }>;
    uploadAvatar(file: any, username?: string): Promise<{
        error: string;
        url?: undefined;
    } | {
        url: string;
        error?: undefined;
    }>;
    deleteFile(body: {
        path: string;
    }): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
}
