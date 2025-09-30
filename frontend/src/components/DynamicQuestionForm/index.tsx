import React, {useEffect, useState} from 'react';
import {Input, Select} from '@arco-design/web-react';

const {TextArea} = Input;

interface DynamicQuestionFormProps {
    questionType: string;
    value?: {
        options?: any;
        answer?: any;
    };
    onChange?: (value: { options: any; answer: any }) => void;
}

const DynamicQuestionForm: React.FC<DynamicQuestionFormProps> = ({
                                                                     questionType = 'SINGLE',
                                                                     value = {},
                                                                     onChange
                                                                 }) => {
    const getDefaultAnswer = (type: string) => {
        switch (type) {
            case 'SINGLE':
            case 'BLANK':
            case 'SHORT_ANSWER':
                return '';
            case 'MULTIPLE':
                return [];
            default:
                return '';
        }
    };
    const [formData, setFormData] = useState({
        options: value.options || {},
        answer: value.answer ?? getDefaultAnswer(questionType)
    });

    // 当外部value变化时，更新内部状态
    useEffect(() => {
        if (value && (value.options || value.answer !== undefined)) {
            setFormData({
                options: value.options || {},
                answer: value.answer ?? getDefaultAnswer(questionType)
            });
        }
    }, [value, questionType]);

    // 当题目类型改变时，只有在没有外部数据时才重置表单数据
    useEffect(() => {
        // 如果有外部传入的数据，不进行重置
        if (value && (Object.keys(value.options || {}).length > 0 || value.answer !== undefined)) {
            return;
        }

        let newOptions = {};
        let newAnswer = {};

        switch (questionType) {
            case 'SINGLE':
                newOptions = {A: '', B: '', C: '', D: ''};
                newAnswer = '';
                break;
            case 'MULTIPLE':
                newOptions = {A: '', B: '', C: '', D: '', E: ''};
                newAnswer = [];
                break;
            case 'BLANK':
                newOptions = {};
                newAnswer = '';
                break;
            case 'SHORT_ANSWER':
                newOptions = {};
                newAnswer = '';
                break;
            default:
                newOptions = {};
                newAnswer = '';
        }

        setFormData({options: newOptions, answer: newAnswer});
        onChange?.({options: newOptions, answer: newAnswer});
    }, [questionType]);

    // 处理选项变化
    const handleOptionChange = (key: string, optionValue: string) => {
        const newOptions = {...formData.options, [key]: optionValue};
        const newFormData = {...formData, options: newOptions};
        setFormData(newFormData);
        onChange?.(newFormData);
    };

    // 处理答案变化
    const handleAnswerChange = (answerValue: any) => {
        const newFormData = {...formData, answer: answerValue};
        setFormData(newFormData);
        onChange?.(newFormData);
    };

    // 渲染单选题表单
    const renderSingleChoiceForm = () => (
        <div>
            <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>选项设置</label>
                {['A', 'B', 'C', 'D'].map(key => (
                    <div key={key} style={{marginBottom: 8}}>
                        <Input
                            placeholder={`选项${key}`}
                            value={formData.options[key] || ''}
                            onChange={(value) => handleOptionChange(key, value)}
                            addonBefore={key}
                        />
                    </div>
                ))}
            </div>
            <div>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>正确答案</label>
                <Select
                    placeholder="请选择正确答案"
                    value={formData.answer}
                    onChange={handleAnswerChange}
                    options={[
                        {label: 'A', value: 'A'},
                        {label: 'B', value: 'B'},
                        {label: 'C', value: 'C'},
                        {label: 'D', value: 'D'}
                    ]}
                />
            </div>
        </div>
    );

    // 渲染多选题表单
    const renderMultipleChoiceForm = () => (
        <div>
            <div style={{marginBottom: 16}}>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>选项设置</label>
                {['A', 'B', 'C', 'D', 'E'].map(key => (
                    <div key={key} style={{marginBottom: 8}}>
                        <Input
                            placeholder={`选项${key}`}
                            value={formData.options[key] || ''}
                            onChange={(value) => handleOptionChange(key, value)}
                            addonBefore={key}
                        />
                    </div>
                ))}
            </div>
            <div>
                <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>正确答案（多选）</label>
                <Select
                    placeholder="请选择正确答案（可多选）"
                    value={formData.answer}
                    onChange={handleAnswerChange}
                    multiple
                    options={[
                        {label: 'A', value: 'A'},
                        {label: 'B', value: 'B'},
                        {label: 'C', value: 'C'},
                        {label: 'D', value: 'D'},
                        {label: 'E', value: 'E'}
                    ]}
                />
            </div>
        </div>
    );

    // 渲染填空题表单
    const renderBlankForm = () => (
        <div>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>标准答案</label>
            <Input
                placeholder="请输入标准答案"
                value={formData.answer}
                onChange={handleAnswerChange}
            />
        </div>
    );

    // 渲染简答题表单
    const renderShortAnswerForm = () => (
        <div>
            <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>参考答案</label>
            <TextArea
                placeholder="请输入参考答案"
                value={formData.answer}
                onChange={handleAnswerChange}
                rows={4}
            />
        </div>
    );

    // 根据题目类型渲染对应表单
    const renderFormByType = () => {
        switch (questionType) {
            case 'SINGLE':
                return renderSingleChoiceForm();
            case 'MULTIPLE':
                return renderMultipleChoiceForm();
            case 'BLANK':
                return renderBlankForm();
            case 'SHORT_ANSWER':
                return renderShortAnswerForm();
            default:
                return <div>请先选择题目类型</div>;
        }
    };

    return (
        <div className="dynamic-question-form">
            {renderFormByType()}
        </div>
    );
};

export default DynamicQuestionForm;