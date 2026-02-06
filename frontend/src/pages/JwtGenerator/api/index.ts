import axios from '@/core/src/http';

/**
 * 生成 JWT Token
 * @param userId 用户 ID
 * @returns JWT Token 字符串
 */
export const generateJwt = (userId: string) =>
    axios.post('/jwt/generate', null, { params: { userId } });
