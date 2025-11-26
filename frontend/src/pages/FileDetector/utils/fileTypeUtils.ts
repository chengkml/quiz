/**
 * 文件类型识别工具函数
 */

export interface FileTypeInfo {
  type: string;         // 文件类型类别
  description: string;  // 详细描述
  icon: string;         // 图标标识
  extension: string;    // 文件扩展名
  mimeType: string;     // MIME类型
}

// 文件类型映射表
const FILE_TYPE_MAPPING: Record<string, { type: string; description: string; icon: string; mimeTypes: string[] }> = {
  // 图像文件
  'jpg': { type: '图像文件', description: 'JPEG图像', icon: 'image', mimeTypes: ['image/jpeg'] },
  'jpeg': { type: '图像文件', description: 'JPEG图像', icon: 'image', mimeTypes: ['image/jpeg'] },
  'png': { type: '图像文件', description: 'PNG图像', icon: 'image', mimeTypes: ['image/png'] },
  'gif': { type: '图像文件', description: 'GIF图像', icon: 'image', mimeTypes: ['image/gif'] },
  'bmp': { type: '图像文件', description: 'BMP位图', icon: 'image', mimeTypes: ['image/bmp'] },
  'webp': { type: '图像文件', description: 'WebP图像', icon: 'image', mimeTypes: ['image/webp'] },
  'svg': { type: '图像文件', description: 'SVG矢量图', icon: 'image', mimeTypes: ['image/svg+xml'] },
  'ico': { type: '图像文件', description: '图标文件', icon: 'image', mimeTypes: ['image/x-icon'] },
  
  // 文档文件
  'pdf': { type: 'PDF文档', description: '便携式文档格式', icon: 'pdf', mimeTypes: ['application/pdf'] },
  'doc': { type: 'Word文档', description: 'Microsoft Word 97-2003文档', icon: 'word', mimeTypes: ['application/msword'] },
  'docx': { type: 'Word文档', description: 'Microsoft Word文档', icon: 'word', mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  'txt': { type: '文本文件', description: '纯文本文件', icon: 'text', mimeTypes: ['text/plain'] },
  'rtf': { type: '文本文件', description: '富文本格式', icon: 'text', mimeTypes: ['application/rtf'] },
  'md': { type: '文本文件', description: 'Markdown文档', icon: 'text', mimeTypes: ['text/markdown'] },
  
  // 电子表格
  'xls': { type: 'Excel表格', description: 'Microsoft Excel 97-2003表格', icon: 'excel', mimeTypes: ['application/vnd.ms-excel'] },
  'xlsx': { type: 'Excel表格', description: 'Microsoft Excel表格', icon: 'excel', mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
  'csv': { type: 'Excel表格', description: '逗号分隔值文件', icon: 'excel', mimeTypes: ['text/csv'] },
  
  // 演示文稿
  'ppt': { type: 'PowerPoint演示文稿', description: 'Microsoft PowerPoint 97-2003演示文稿', icon: 'ppt', mimeTypes: ['application/vnd.ms-powerpoint'] },
  'pptx': { type: 'PowerPoint演示文稿', description: 'Microsoft PowerPoint演示文稿', icon: 'ppt', mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
  
  // 压缩文件
  'zip': { type: '压缩文件', description: 'ZIP压缩文件', icon: 'archive', mimeTypes: ['application/zip'] },
  'rar': { type: '压缩文件', description: 'RAR压缩文件', icon: 'archive', mimeTypes: ['application/x-rar-compressed'] },
  '7z': { type: '压缩文件', description: '7-Zip压缩文件', icon: 'archive', mimeTypes: ['application/x-7z-compressed'] },
  'tar': { type: '压缩文件', description: 'TAR归档文件', icon: 'archive', mimeTypes: ['application/x-tar'] },
  'gz': { type: '压缩文件', description: 'GZIP压缩文件', icon: 'archive', mimeTypes: ['application/gzip'] },
  'bz2': { type: '压缩文件', description: 'BZIP2压缩文件', icon: 'archive', mimeTypes: ['application/x-bzip2'] },
  
  // 代码文件
  'js': { type: '代码文件', description: 'JavaScript文件', icon: 'code', mimeTypes: ['application/javascript'] },
  'jsx': { type: '代码文件', description: 'React JSX文件', icon: 'code', mimeTypes: ['text/jsx'] },
  'ts': { type: '代码文件', description: 'TypeScript文件', icon: 'code', mimeTypes: ['application/typescript'] },
  'tsx': { type: '代码文件', description: 'React TypeScript文件', icon: 'code', mimeTypes: ['text/tsx'] },
  'html': { type: '代码文件', description: 'HTML文件', icon: 'code', mimeTypes: ['text/html'] },
  'htm': { type: '代码文件', description: 'HTML文件', icon: 'code', mimeTypes: ['text/html'] },
  'css': { type: '代码文件', description: 'CSS样式文件', icon: 'code', mimeTypes: ['text/css'] },
  'less': { type: '代码文件', description: 'LESS样式文件', icon: 'code', mimeTypes: ['text/less'] },
  'scss': { type: '代码文件', description: 'SCSS样式文件', icon: 'code', mimeTypes: ['text/x-scss'] },
  'sass': { type: '代码文件', description: 'SASS样式文件', icon: 'code', mimeTypes: ['text/x-sass'] },
  'php': { type: '代码文件', description: 'PHP文件', icon: 'code', mimeTypes: ['application/x-httpd-php'] },
  'py': { type: '代码文件', description: 'Python文件', icon: 'code', mimeTypes: ['text/x-python'] },
  'java': { type: '代码文件', description: 'Java文件', icon: 'code', mimeTypes: ['text/x-java-source'] },
  'c': { type: '代码文件', description: 'C语言文件', icon: 'code', mimeTypes: ['text/x-c'] },
  'cpp': { type: '代码文件', description: 'C++文件', icon: 'code', mimeTypes: ['text/x-c++src'] },
  'cs': { type: '代码文件', description: 'C#文件', icon: 'code', mimeTypes: ['text/x-csharp'] },
  'go': { type: '代码文件', description: 'Go语言文件', icon: 'code', mimeTypes: ['text/x-go'] },
  'rb': { type: '代码文件', description: 'Ruby文件', icon: 'code', mimeTypes: ['text/x-ruby'] },
  'sh': { type: '代码文件', description: 'Shell脚本', icon: 'code', mimeTypes: ['application/x-sh'] },
  'bat': { type: '代码文件', description: '批处理文件', icon: 'code', mimeTypes: ['application/x-msdownload'] },
  'ps1': { type: '代码文件', description: 'PowerShell脚本', icon: 'code', mimeTypes: ['application/x-powershell'] },
  
  // 数据文件
  'json': { type: '数据文件', description: 'JSON数据文件', icon: 'json', mimeTypes: ['application/json'] },
  'xml': { type: '数据文件', description: 'XML数据文件', icon: 'xml', mimeTypes: ['application/xml'] },
  'yaml': { type: '数据文件', description: 'YAML数据文件', icon: 'xml', mimeTypes: ['text/yaml'] },
  'yml': { type: '数据文件', description: 'YAML数据文件', icon: 'xml', mimeTypes: ['text/yaml'] },
  'sql': { type: '数据文件', description: 'SQL脚本文件', icon: 'code', mimeTypes: ['text/x-sql'] },
  
  // 音频文件
  'mp3': { type: '音频文件', description: 'MP3音频', icon: 'audio', mimeTypes: ['audio/mpeg'] },
  'wav': { type: '音频文件', description: 'WAV音频', icon: 'audio', mimeTypes: ['audio/wav'] },
  'ogg': { type: '音频文件', description: 'OGG音频', icon: 'audio', mimeTypes: ['audio/ogg'] },
  'flac': { type: '音频文件', description: 'FLAC音频', icon: 'audio', mimeTypes: ['audio/flac'] },
  'aac': { type: '音频文件', description: 'AAC音频', icon: 'audio', mimeTypes: ['audio/aac'] },
  
  // 视频文件
  'mp4': { type: '视频文件', description: 'MP4视频', icon: 'video', mimeTypes: ['video/mp4'] },
  'avi': { type: '视频文件', description: 'AVI视频', icon: 'video', mimeTypes: ['video/x-msvideo'] },
  'mov': { type: '视频文件', description: 'QuickTime视频', icon: 'video', mimeTypes: ['video/quicktime'] },
  'wmv': { type: '视频文件', description: 'Windows Media视频', icon: 'video', mimeTypes: ['video/x-ms-wmv'] },
  'flv': { type: '视频文件', description: 'Flash视频', icon: 'video', mimeTypes: ['video/x-flv'] },
  'mkv': { type: '视频文件', description: 'Matroska视频', icon: 'video', mimeTypes: ['video/x-matroska'] },
};

/**
 * 通过文件扩展名获取文件类型信息
 * @param extension 文件扩展名（小写）
 * @param mimeType 文件MIME类型
 * @returns 文件类型信息
 */
export function getFileTypeByExtension(extension: string, mimeType: string): FileTypeInfo {
  const normalizedExtension = extension.toLowerCase();
  const typeInfo = FILE_TYPE_MAPPING[normalizedExtension];
  
  if (typeInfo) {
    return {
      type: typeInfo.type,
      description: typeInfo.description,
      icon: typeInfo.icon,
      extension: normalizedExtension,
      mimeType: mimeType || typeInfo.mimeTypes[0] || 'application/octet-stream'
    };
  }
  
  // 未知文件类型
  return {
    type: '未知文件类型',
    description: '无法识别的文件格式',
    icon: 'unknown',
    extension: normalizedExtension,
    mimeType: mimeType || 'application/octet-stream'
  };
}

/**
 * 从文件名中提取扩展名
 * @param filename 文件名
 * @returns 文件扩展名（不包含点号）
 */
export function extractFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDotIndex + 1);
}

/**
 * 识别文件类型
 * @param file File对象
 * @returns 文件类型信息
 */
export async function identifyFileType(file: File): Promise<FileTypeInfo> {
  const extension = extractFileExtension(file.name);
  
  // 首先通过扩展名识别
  let typeInfo = getFileTypeByExtension(extension, file.type);
  
  // 如果是未知类型，可以尝试通过内容识别（魔术数字）
  if (typeInfo.type === '未知文件类型') {
    try {
      const contentBasedType = await identifyFileTypeByContent(file);
      if (contentBasedType) {
        return contentBasedType;
      }
    } catch (error) {
      console.warn('基于内容的文件类型识别失败:', error);
    }
  }
  
  return typeInfo;
}

/**
 * 通过文件内容识别文件类型（魔术数字）
 * @param file File对象
 * @returns 文件类型信息或null
 */
async function identifyFileTypeByContent(file: File): Promise<FileTypeInfo | null> {
  // 读取文件的前几个字节
  const buffer = await file.slice(0, 12).arrayBuffer();
  const view = new Uint8Array(buffer);
  
  // 将前几个字节转换为十六进制字符串，用于匹配魔术数字
  const headerHex = Array.from(view)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  
  // 检查常见的魔术数字
  // JPEG
  if (headerHex.startsWith('ffd8')) {
    return getFileTypeByExtension('jpg', 'image/jpeg');
  }
  
  // PNG
  if (headerHex.startsWith('89504e47')) {
    return getFileTypeByExtension('png', 'image/png');
  }
  
  // GIF
  if (headerHex.startsWith('47494638')) {
    return getFileTypeByExtension('gif', 'image/gif');
  }
  
  // PDF
  if (headerHex.startsWith('25504446')) {
    return getFileTypeByExtension('pdf', 'application/pdf');
  }
  
  // ZIP
  if (headerHex.startsWith('504b0304') || headerHex.startsWith('504b0506') || headerHex.startsWith('504b0708')) {
    return getFileTypeByExtension('zip', 'application/zip');
  }
  
  // RAR
  if (headerHex.startsWith('52617221')) {
    return getFileTypeByExtension('rar', 'application/x-rar-compressed');
  }
  
  // MP3
  if (headerHex.startsWith('494433') || headerHex.startsWith('fffb') || headerHex.startsWith('fff3')) {
    return getFileTypeByExtension('mp3', 'audio/mpeg');
  }
  
  // MP4
  if (headerHex.startsWith('66747970') || headerHex.startsWith('667479704d534e56')) {
    return getFileTypeByExtension('mp4', 'video/mp4');
  }
  
  // DOCX, XLSX, PPTX (Office Open XML)
  if (headerHex.startsWith('504b0304')) {
    // 这些文件本质上是ZIP文件，但我们已经在上面处理了ZIP，这里可以进一步检查
    // 但在客户端环境中，这可能需要解压缩，这里简化处理
  }
  
  // 无法通过内容识别
  return null;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}