import React from 'react';
import {Button, Grid, Typography, Tag, Form} from '@arco-design/web-react';
import { findDOMNode } from 'react-dom';
import { contains, off, on } from '@arco-design/web-react/es/_util/dom';
import { GlobalContext } from '@/utils/context';
import './style/index.less';
import { IconBrush, IconFilter } from "@arco-design/web-react/icon";

const Row = Grid.Row;
const Col = Grid.Col;

/**
 * FilterForm 组件
 * 支持自定义表单内容，通过 children 传入
 * 提供已选条件标签显示、展开/收起更多、重置、搜索等功能
 */
class FilterForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            valueList: [],
            more: false,
            values: props.initialValues || {},
        };
        this.values = props.initialValues || {};
        this.valueList = [];
        this.triggerRef = React.createRef();
        this.formRef = React.createRef();
    }

    // 表单值变化回调
    handleValuesChange = (changeValue, values) => {
        this.setValueList(values);
        this.setState({ values });
        this.values = values;
        const { onValuesChange } = this.props;
        setTimeout(() => {
            typeof onValuesChange === 'function' && onValuesChange(changeValue, values);
        }, 0);
    };

    // 获取当前筛选条件
    getReportFiltersValue = () => {
        return { ...this.values };
    };

    // 更新已选条件标签
    setValueList = (values) => {
        if (!values) return;
        const valueList = [];
        for (let key in values) {
            if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
                valueList.push({ field: key, value: values[key], valueLabel: values[key], label: key });
            }
        }
        this.valueList = valueList;
        this.setState({ valueList });
    };

    // 重置表单
    handleResetForm = () => {
        this.formRef.current.resetFields();
        const initialValues = this.props.initialValues || {};
        this.values = { ...initialValues };
        this.setState({ values: { ...initialValues } });
        typeof this.props.onReset === 'function' && this.props.onReset();
    };

    // 展开/收起更多筛选项
    handleMore = () => {
        this.setState({ more: !this.state.more });
    };

    // 点击组件外部时收起更多筛选项
    onClickOutside = (e) => {
        if (!this.state.more) return;
        const triggerNode = findDOMNode(this.triggerRef.current);
        const childrenDom = findDOMNode(this);
        if (!contains(triggerNode, e.target) && !contains(childrenDom, e.target)) {
            this.setState({ more: false });
        }
    };

    // 查询按钮
    onSearch = () => {
        typeof this.props.onSearch === 'function' && this.props.onSearch(this.getReportFiltersValue());
    };

    componentDidMount() {
        this.setValueList(this.values);
        on(window.document, 'mousedown', this.onClickOutside);
    }

    componentWillUnmount() {
        off(window.document, 'mousedown', this.onClickOutside);
    }

    render() {
        const { more, valueList } = this.state;
        const { min = 3, className, style, showButtonText } = this.props;

        const childrenArray = React.Children.toArray(this.props.children);
        const full = childrenArray.length <= min;

        // 按钮组宽度计算
        let operFlex = 0;
        if (childrenArray.length > min) {
            operFlex = more ? (showButtonText ? 212 : 148) : (showButtonText ? 178 : 148);
        } else {
            operFlex = showButtonText ? 130 : 110;
        }
        const resultOperFlex = showButtonText ? 230 : 220;

        return (
            <div
                className={[className, 'modo-filter-form', more ? 'more' : '', full ? 'full' : ''].join(' ')}
                style={style}
                ref={this.triggerRef}
            >
                <div className="modo-filter-form-content">
                    <Row style={{ flexFlow: 'nowrap' }}>
                        {/* 自定义表单区域 */}
                        <Col flex="auto" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <Form ref={this.formRef} onValuesChange={(value, values)=>{this.handleValuesChange(value, values)}}>
                                    {!more ? childrenArray.slice(0, min) : childrenArray}
                                </Form>
                            </div>
                        </Col>

                        {/* 按钮组 */}
                        <Col className="oper-group" flex={`${operFlex}px`} style={{ marginLeft: '10px' }}>
                            {/* 重置按钮 */}
                            {!showButtonText ? (
                                <Button className="reset" icon={<IconBrush />} style={{ marginRight: '10px' }} onClick={this.handleResetForm}>
                                    重置
                                </Button>
                            ) : (
                                <Button className="reset" type="text" style={{ width: '48px', marginRight: more || full ? '10px' : '0px', padding: '0px' }} onClick={this.handleResetForm}>
                                    重置
                                </Button>
                            )}

                            {/* 更多筛选按钮 */}
                            {!(full || more) && (!showButtonText ? (
                                <Button className="filter" icon={<IconFilter />} style={{ marginRight: '10px' }} onClick={this.handleMore}>
                                    更多
                                </Button>
                            ) : (
                                <Button className="filter" type="text" style={{ width: '48px', marginRight: '10px', padding: '0px' }} onClick={this.handleMore}>
                                    更多
                                </Button>
                            ))}

                            {/* 查询按钮 */}
                            <Button className="search" type="primary" style={{ width: '72px' }} onClick={this.onSearch}>
                                查询
                            </Button>

                            {/* 收起按钮 */}
                            {more && (
                                <Button className="collapse" style={{ width: '72px', marginLeft: '10px' }} onClick={this.handleMore}>
                                    收起
                                </Button>
                            )}
                        </Col>
                    </Row>

                    {/* 已选筛选条件标签 */}
                    {!full && (
                        <div className="filter-form-result" style={{ width: more ? `calc(100% - ${resultOperFlex}px)` : '100%' }}>
              <span style={{ display: 'inline-block', color: 'var(--color-gray-6)', marginRight: '10px', lineHeight: '20px' }}>
                已选筛选条件:
              </span>
                            <div className="tag-list" style={{ lineHeight: more ? '20px' : '20px' }}>
                                {valueList.length > 0 ? valueList.map(item => (
                                    <Tag
                                        key={item.field}
                                        visible
                                        size="small"
                                        closable
                                        color="arcoblue"
                                        onClose={() => {
                                            delete this.values[item.field];
                                            this.setValueList(this.values);
                                        }}
                                        style={{ marginLeft: '4px', marginBottom: '6px' }}
                                    >
                    <span className="result">
                      <span className="label">{item.label}: </span>
                      <Typography.Text className="value" ellipsis={{ cssEllipsis: true, rows: 1, showTooltip: true }}>
                        {item.valueLabel}
                      </Typography.Text>
                    </span>
                                    </Tag>
                                )) : <span>全部</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

FilterForm.contextType = GlobalContext;

export default FilterForm;
