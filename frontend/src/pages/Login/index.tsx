import React from 'react';
import './style/index.less';
import appLoginBg from './images/app-login-bg.png';
import {Button, Checkbox, Drawer, Form, Input, Message, Notification,} from '@arco-design/web-react';
import {GlobalContext} from '@/utils/context';
import {LoginUserInfo} from '@/types/user';

import {getResetPwdVerifyCode, getUserExist, LoginSubmitPost, resetPwd,} from './api/index';

const FormItem = Form.Item;
let timer: any;
let logoTitle = '';
let logoUrl = '';
let isverifycode: any;
let hiddenLogo: any;

interface LoginProps {
    onLoginSuccess?: (username: string) => void;
    identity?: any;
}

class appLogin extends React.Component<LoginProps> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            drawVisible: false,
            nextStep: 0,
            sendCode: '',
            errorText: '',
            infoData: {
                userId: '',
                pwd: '',
                remember: false,
                code: ''
            },
            drawerForm: {
                userId: '',
                verifyCode: '',
                pwd: ''
            },
            sendCodeDisabled: false,
            sendCodeFirst: true,
            sendTime: 60,
            sendTimeInterval: null,
            isUserPassword: true,
            isUserPasswordMore: true,
            verifyImgSrc: '_api/getPicture.jpeg/',
            isCodeEqual: false
        };


        // 暂时使用默认配置，等待redux依赖安装后再使用props.identity
        const identity = props.identity || {};
        const {extConf, label} = identity;
        if (extConf) {
            logoTitle = extConf.loginTitle || '数据合成平台';
            logoUrl = extConf.logoUrl;
            isverifycode = extConf.isverifycode === true;
            hiddenLogo = extConf.hiddenLogo;
            document.title = extConf.loginTitle || label || '数据合成平台';
        } else {
            // 默认配置
            logoTitle = '数据合成平台';
            logoUrl = '';
            isverifycode = false;
            hiddenLogo = false;
            document.title = '数据合成平台';
        }
    };

    aesEncrypt = async (message: any) => {
        // 暂时返回原始消息，等待crypto-js依赖安装后再实现加密
        return message;
    };

    validatorUseId = async (
        value: string,
        cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
    ) => {
        const params = {
            userId: encodeURI(await this.aesEncrypt(this.state.drawerForm.userId.trim())),
        };
        if (!value || value.trim().length < 0) {
            cb('请输入账号');
            return
        }
        await getUserExist(params)
            .then(res => {
                if (res.data.data === true) {
                    cb();
                    return;
                }
                cb('用户不存在!');
            })
            .catch(e => {
                cb('用户校验失败!');
            });
    };

    validatorVerifyCode = async (
        value: string,
        cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
    ) => {
        console.log('value', value);
        if (!value || value?.trim().length <= 0) {
            cb('请输入验证码');
            return;
        }
        const temp = value?.trim();
        if (temp.length !== 4) {
            cb('长度为4个字符');
            return;
        }
    };

    validatorPassword = (
        value: string,
        cb: { (error?: React.ReactNode): void; (arg0: Error | undefined): void },
    ) => {
        if (value) {
            const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (reg.test(value)) {
                cb();
            } else {
                cb(new Error('长度至少为8,包含大小写字母、数字和特殊字符'));
            }
        } else {
            cb(new Error('长度至少为8,包含大小写字母、数字和特殊字符'));
        }
    };

    getPicuture = () => {
        const stime = new Date().getTime();
        this.setState({verifyImgSrc: `_api/getPicture.jpeg/?${stime}`});
    };

    reloadCheckCode = () => {
        this.getPicuture();
        this.setState({isCodeEqual: false});
    };
// 查找第一个可访问的菜单（递归查找）
    findFirstAccessibleMenu = (menus: any[]): any | null => {
        for (const menu of menus) {
            // 如果是菜单类型且有路径，返回该菜单
            if (menu.menuType === 'MENU' && menu.menuExtConf) {
                const parseConf = JSON.parse(menu.menuExtConf);
                if (parseConf.path) {
                    return menu;
                }
            }
            // 如果有子菜单，递归查找
            if (menu.children && menu.children.length > 0) {
                const found = this.findFirstAccessibleMenu(menu.children);
                if (found) return found;
            }
        }
        return null;
    };
    submitSuccess = (response) => {
        // 真实接口成功响应处理
        if (response && response.status === 200) {
            this.rememberClick();

            // 构建用户信息对象
            const userInfo: LoginUserInfo = {
                userId: response.data?.userId || '',
                userName: response.data?.userName || '',
                email: response.data?.email || '',
                phone: response.data?.phone || '',
                acctType: response.data?.acctType || '',
                logo: response.data?.logo || '',
                roles: response.data?.roles || [],
                permissions: response.data?.permissions || [],
                loginTime: new Date().toISOString()
            };

            // 从响应中提取token，如果没有则生成临时token
            const token = response.data?.data?.token || 'session-token-' + Date.now();

            // 保存到localStorage（保持兼容性）
            localStorage.setItem('token', token);
            localStorage.setItem('username', userInfo.userName);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 调用父组件传递的登录成功回调
            if (this.props.onLoginSuccess) {
                this.props.onLoginSuccess(userInfo.userName);
            }

            // 跳转到默认页面 - 现在由LoginWrapper处理菜单加载后的跳转
            // 暂时跳转到主页面，具体路由将由菜单数据决定
            setTimeout(() => {
                window.location.href = '/quiz/frame';
            }, 100);
        } else {
            this.setState({isUserPassword: false});
            if (this.loginForm) {
                this.loginForm.setFieldValue('infoData.userId', '');
                this.loginForm.setFieldValue('infoData.pwd', '');
            }
            Message.error(response?.message || '登录失败');
            this.reloadCheckCode();
        }
    };

    loginSubmit = (paras: any) => {
        LoginSubmitPost(paras)
            .then(response => {
                // 真实接口返回的数据结构
                this.submitSuccess(response);
            })
            .catch(err => {
                console.log('登录失败:', err);
                Message.error('登录失败，请检查用户名和密码');
                this.setState({isUserPassword: false});
                if (this.loginForm) {
                    this.loginForm.setFieldValue('infoData.userId', '');
                    this.loginForm.setFieldValue('infoData.pwd', '');
                }
                this.reloadCheckCode();
            });
    };

    // 登录
    loginClick = async () => {
        this.setState({isUserPasswordMore: true, isUserPassword: true});
        const _self = this;
        if (isverifycode) {
            (async function verifyCode(self) {
                // const formLoginData = _self.loginForm.getFieldsValue();
                // const params = { checkcode: formLoginData.infoData.code };
                // await getVerifyCode(qs.stringify(params))
                //   .then((response: { data: { data: any } }) => {
                //     const tdata = response.data.data;
                //     if (tdata.comparecode) {
                //       _self.setState({isCodeEqual: true})
                //     } else {
                //       _self.setState({isCodeEqual: false})
                //     }
                //   })
                //   .catch((error: any) => {
                //     console.log(error);
                //     _self.setState({isCodeEqual: false})
                //   });
                //   if (!_self.state.isCodeEqual) {
                //     _self.loginForm.setFieldValue('infoData.code', '');
                //   };
                _self.loginForm.validate(async (errors, values) => {
                    console.log('cc', errors, values);
                    if (!errors) {
                        const [encUserId, encPwd] = await Promise.all([
                            _self.aesEncrypt(values.infoData.userId),
                            _self.aesEncrypt(values.infoData.pwd),
                        ]);
                        const paras = {
                            userId: encUserId,
                            userPwd: encPwd,
                            callback: 'none',
                            checkcode: values.infoData.code,
                        };
                        _self.loginSubmit(paras);
                    }
                });
            })(this);
        } else {
            _self.loginForm.validate(async (errors, values) => {
                console.log('values', values);
                if (!errors) {
                    const [encUserId, encPwd] = await Promise.all([
                        _self.aesEncrypt(values.infoData.userId),
                        _self.aesEncrypt(values.infoData.pwd),
                    ]);
                    const paras = {
                        userId: encUserId,
                        userPwd: encPwd,
                        callback: 'none',
                    };
                    _self.loginSubmit(paras);
                }
            });
        }
    };

    openClick = () => {
        this.setState({drawVisible: true, sendTime: 60, sendCodeDisabled: false});
        clearInterval(timer);
    };

    closeClick = () => {
        this.setState({drawVisible: false, nextStep: 0});
        this.drawerForm.resetFields();
    };

    // 下一步
    nextClick = async () => {
        try {
            await this.drawerForm.validate();
            if (this.state.nextStep == 0) {
                this.setState({nextStep: this.state.nextStep + 1});
            } else if (this.state.nextStep == 1) {
                this.setState({nextStep: this.state.nextStep + 1});
            } else if (this.state.nextStep == 2) {
                const params = {
                    userId: encodeURI(this.aesEncrypt(this.state.drawerForm.userId)),
                    verifyCode: this.state.drawerForm.verifyCode,
                    pwd: encodeURI(this.aesEncrypt(this.state.drawerForm.pwd)),
                    type: '3',
                };
                resetPwd(params)
                    .then(res => {
                        if (res.data.success) {
                            Notification.success({title: '成功', content: res.data.message});
                            this.closeClick();
                        } else {
                            Notification.error({title: '失败', content: res.data.message});
                        }
                    })
                    .catch(error => {
                        Notification.error({
                            title: '失败',
                            content: '重置密码失败',
                        });
                    });
            }
        } catch (e) {
            Notification.error({
                title: '失败',
                content: '重置密码失败',
            });
        }
    };
    onValuesChange = (changeValue: any, values: any) => {
        if (values) {
            this.setState({infoData: {...this.state.infoData, ...values.infoData}});
        }
    };

    onFormValuesChange = (changeValue: any, values: any) => {
        if (values.data) {
            this.setState({drawerForm: {...this.state.drawerForm, ...values.data}});
        }
    };
    linkClick = (url) => {
        window.open(url, '_blank',)
    }
    rememberClick = () => {
        const formLoginData = this.loginForm.getFieldsValue();
        if (formLoginData.infoData.remember) {
            localStorage.setItem('loginUserId', formLoginData.infoData.userId);
            localStorage.setItem('loginPassword', formLoginData.infoData.pwd);
        } else {
            localStorage.removeItem('loginUserId');
            localStorage.removeItem('loginPassword');
        }
    };

    handleSendCode = () => {
        const {sendCodeDisabled} = this.state;
        if (sendCodeDisabled) {
            return;
        }
        this.setState({sendCodeDisabled: true, sendTime: 60}, () => {
            timer = setInterval(() => {
                this.setState({sendTime: this.state.sendTime - 1});
                if (this.state.sendTime === 0) {
                    clearInterval(timer);
                    this.setState({sendCodeDisabled: false, sendCodeFirst: false});
                }
            }, 1000);
            const params = {
                userId: this.aesEncrypt(this.state.drawerForm.userId),
            };
            getResetPwdVerifyCode(params)
                .then(res => {
                    if (res.data.success) {
                        Message.success('发送验证码成功!');
                    } else {
                        Message.error('发送验证码失败!');
                    }
                }).catch(e => {
                Message.error('发送验证码失败!');
            });
        });
    };

    getUserPassword = () => {
        const userId = localStorage.getItem('loginUserId');
        if (userId && userId.length > 0) {
            this.setState({infoData: {userId: userId}});
        }
        const password = localStorage.getItem('loginPassword');
        if (password && password.length > 0) {
            this.setState({infoData: {pwd: password}});
        }
        if (userId && userId.length > 0 && password && password.length > 0) {
            this.setState({infoData: {remember: true}});
        }
    };

    componentDidMount() {
        sessionStorage.setItem('MENUACTIVE', '33149f9c1318487d');
        this.getUserPassword();
    }

    render() {
        // 创建简单的翻译函数替代Hook
        const t = (key: string, defaultValue?: string) => defaultValue || key;
        let formItemContent = null;
        const {
            nextStep,
            sendCodeDisabled,
            errorText,
            drawVisible,
            sendCodeFirst,
            sendTime,
            infoData,
            verifyImgSrc,
        } = this.state;
        switch (nextStep) {
            case 0:
                formItemContent = (
                    <div>
                        <Form.Item
                            label="请输入账号"
                            field="data.drawerForm.userId"
                            required
                            rules={[{validator: (value, cb) => this.validatorUseId(value, cb)}]}
                        >
                            <Input placeholder="请输入账号"/>
                        </Form.Item>
                    </div>
                );
                break;
            case 1:
                formItemContent = (
                    <div style={{position: 'relative'}}>
                        <Form.Item
                            label="验证码"
                            field="data.drawerForm.verifyCode"
                            rules={[
                                {
                                    required: true,
                                    validator: (value, cb) => this.validatorVerifyCode(value, cb),
                                },
                            ]}
                        >
                            <Input placeholder="请输入验证码"/>
                        </Form.Item>
                        <Button
                            type="text"
                            className="send-btn"
                            onClick={this.handleSendCode}
                            disabled={sendCodeDisabled}
                        >
                            {!sendCodeDisabled && sendCodeFirst && <span>发送验证码</span>}
                            {sendCodeDisabled && (
                                <span>
                  重新发送
                                    {sendTime}
                </span>
                            )}
                            {!sendCodeDisabled && !sendCodeFirst && <span>重新发送</span>}
                        </Button>
                    </div>
                );
                break;
            case 2:
                formItemContent = (
                    <div>
                        <Form.Item
                            label="新密码"
                            field="data.drawerForm.pwd"
                            rules={[
                                {
                                    required: true,
                                    validator: (value, cb) => this.validatorPassword(value, cb),
                                },
                            ]}
                        >
                            <Input placeholder="请输入密码"/>
                        </Form.Item>
                    </div>
                );
                break;
        }
        return (
            <div className="modo-app-login">
                <img className="bg" src={appLoginBg}/>
                <div className={'login-all' + (isverifycode ? ' hasverfiy' : '')}>
                    <div className="login-dialog">
                        <div className="login-info">
                            <Form
                                className="login-form"
                                onValuesChange={this.onValuesChange}
                                ref={ref => (this.loginForm = ref)}
                            >
                                <FormItem
                                    label="账号名称"
                                    required
                                    field="infoData.userId"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入账号",
                                            min: 3,
                                            max: 192,
                                        },
                                    ]}
                                >
                                    <Input placeholder="请输入账号"/>
                                </FormItem>
                                <FormItem
                                    label="登录密码"
                                    required
                                    field="infoData.pwd"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入密码",
                                            min: 3,
                                            max: 192,
                                        },
                                    ]}
                                >
                                    <Input placeholder="请输入密码" type="password"/>
                                </FormItem>
                                {isverifycode && (
                                    <>
                                        <FormItem
                                            label="验证码"
                                            className="form-itm form-itm-pass"
                                            field="infoData.code"
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    validator: (value, cb) => this.validatorVerifyCode(value, cb),
                                                },
                                            ]}
                                        >
                                            <Input
                                                id="checkcode"
                                                className="code-input"
                                                placeholder="请输入验证码"
                                            />
                                        </FormItem>
                                        <div className="verifycode-img">
                                            {verifyImgSrc !== undefined && verifyImgSrc !== '' ? (
                                                <img id="checkcodeImg" src={verifyImgSrc}
                                                     onClick={this.reloadCheckCode}></img>
                                            ) : (
                                                <div className="codeblank" onClick={this.reloadCheckCode}></div>
                                            )}
                                        </div>
                                    </>
                                )}
                                <FormItem wrapperCol={{offset: 5}} field="infoData.remember">
                                    <div className='item-remember'>
                                        <Checkbox checked={infoData.remember} onChange={this.rememberClick}>
                                            记住密码
                                        </Checkbox>
                                    </div>

                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: '0px',
                                    }}
                                    wrapperCol={{
                                        offset: 5,
                                    }}
                                >
                                    <Button htmlType="submit" type="primary" onClick={this.loginClick}>
                                        登录
                                    </Button>
                                </FormItem>
                                {errorText && (
                                    <FormItem>
                                        <span style={{color: '#f53f3f'}}>{errorText}</span>
                                    </FormItem>
                                )}
                            </Form>
                            {/* <Button type='text' className="find-password" onClick={this.openClick}> 找回密码 </Button> */}
                            <Drawer
                                width="60%"
                                title={<span>找回密码</span>}
                                okText={nextStep < 2 ? "下一步" : "保存"}
                                visible={drawVisible}
                                onOk={this.nextClick}
                                onCancel={this.closeClick}
                            >
                                <Form
                                    layout="vertical"
                                    ref={(ref) => (this.drawerForm = ref)}
                                    onValuesChange={this.onFormValuesChange}
                                    className="drawer-form">
                                    {formItemContent}
                                </Form>
                            </Drawer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

appLogin.contextType = GlobalContext;
export default appLogin;
