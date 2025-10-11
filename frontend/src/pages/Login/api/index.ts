import axios from '@/core/src/http';

const base = '/quiz';

//登录
const LoginSubmitPost = Params => axios.post(`${base}/api/user/login`, Params);

//判断用户名是否存在
const getUserExist = params => axios.get(`${base}/_api/_/modoUser/exist`, {params});

//获取验证码
const getResetPwdVerifyCode = params => axios.get(`${base}/_api/_/modoUser/getResetPwdVerifyCode`, {params});

//保存
const resetPwd = Params => axios.post(`${base}/_api/_/modoUser/resetPwd`, Params);


export {
    LoginSubmitPost,
    getUserExist,
    getResetPwdVerifyCode,
    resetPwd,
};
