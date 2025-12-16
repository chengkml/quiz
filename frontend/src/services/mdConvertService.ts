import axios from '@/core/src/http';

export interface MdConvertRequest {
  mdContent: string;
  fileName?: string;
}

export interface MdConvertHtmlRequest {
  mdContent: string;
}

export interface MdConvertHtmlResponse {
  success: boolean;
  message: string;
  data?: string;
}

export interface MdConvertResponse {
  success: boolean;
  message: string;
}

/**
 * 将 Markdown 转换为 HTML
 */
export const convertMarkdownToHtml = async (data: MdConvertHtmlRequest): Promise<MdConvertHtmlResponse> => {
  const response = await axios.post('/md-convert/to-html', data);
  return response.data;
};

/**
 * 将 Markdown 转换为 Word (DOCX)
 */
export const convertMarkdownToWord = async (data: MdConvertRequest): Promise<ArrayBuffer> => {
  const response = await axios.post('/md-convert/to-word', data, {
    responseType: 'arraybuffer',
  });
  return response.data;
};

/**
 * 将 Markdown 转换为 PDF
 */
export const convertMarkdownToPdf = async (data: MdConvertRequest): Promise<ArrayBuffer> => {
  const response = await axios.post('/md-convert/to-pdf', data, {
    responseType: 'arraybuffer',
  });
  return response.data;
};
