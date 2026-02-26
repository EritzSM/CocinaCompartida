"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
function filename(req, file, cb) {
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = (0, path_1.extname)(file.originalname);
    cb(null, `${name}${fileExt}`);
}
let UploadsController = class UploadsController {
    async debugUploads() {
        const uploadsPath = (0, path_1.join)(process.cwd(), 'uploads');
        try {
            const findFiles = async (dir, fileList = []) => {
                try {
                    const files = await fs_1.promises.readdir(dir);
                    for (const file of files) {
                        const filePath = (0, path_1.join)(dir, file);
                        const stat = await fs_1.promises.stat(filePath);
                        if (stat.isDirectory()) {
                            await findFiles(filePath, fileList);
                        }
                        else {
                            fileList.push(filePath.replace(uploadsPath, ''));
                        }
                    }
                }
                catch (e) {
                }
                return fileList;
            };
            const files = await findFiles(uploadsPath);
            return {
                uploadsPath,
                cwd: process.cwd(),
                totalFiles: files.length,
                files
            };
        }
        catch (e) {
            return { error: String(e), uploadsPath, cwd: process.cwd() };
        }
    }
    async uploadRecipeFiles(id, files) {
        const urls = (files || []).map(f => `/uploads/recipes/${id}/${f.filename}`);
        console.log(`✅ Uploaded ${urls.length} recipe images for recipe ${id}`);
        return { urls };
    }
    async uploadAvatar(file, username) {
        if (!file) {
            console.error('❌ No file uploaded');
            return { error: 'No file uploaded' };
        }
        const url = `/uploads/avatars/${file.filename}`;
        console.log('✅ Avatar uploaded:', {
            username,
            filename: file.filename,
            url,
            path: file.path,
            size: file.size,
        });
        return { url };
    }
    async deleteFile(body) {
        if (!body || !body.path) {
            console.error('❌ No path provided for deletion');
            return { ok: false, error: 'No path provided' };
        }
        const p = (0, path_1.join)(process.cwd(), 'uploads', body.path.replace(/^\/uploads\//, ''));
        console.log('🗑️  Attempting to delete file:', p);
        try {
            await fs_1.promises.unlink(p);
            console.log('✅ File deleted successfully:', p);
            return { ok: true };
        }
        catch (e) {
            console.error('❌ Delete failed:', e);
            return { ok: false, error: String(e) };
        }
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Get)('debug'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "debugUploads", null);
__decorate([
    (0, common_1.Post)('recipes/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, {
        storage: (0, multer_1.diskStorage)({
            destination: async (req, file, cb) => {
                const recipeId = req.params.id;
                const dir = (0, path_1.join)(process.cwd(), 'uploads', 'recipes', recipeId);
                await fs_1.promises.mkdir(dir, { recursive: true });
                cb(null, dir);
            },
            filename,
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadRecipeFiles", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: async (req, file, cb) => {
                const dir = (0, path_1.join)(process.cwd(), 'uploads', 'avatars');
                try {
                    await fs_1.promises.mkdir(dir, { recursive: true });
                    cb(null, dir);
                }
                catch (error) {
                    console.error('❌ Error creating avatars directory:', error);
                    cb(error, dir);
                }
            },
            filename: (req, file, cb) => {
                const username = req.query.username || 'anonymous';
                const timestamp = Date.now();
                const random = Math.round(Math.random() * 1e9);
                const fileExt = (0, path_1.extname)(file.originalname);
                const cleanUsername = username.replace(/[^a-zA-Z0-9-_]/g, '');
                cb(null, `${cleanUsername}-${timestamp}-${random}${fileExt}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteFile", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map