import { useState } from 'react'
import { Form, Input, Button, Card, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import './Login.css'

export function Login() {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const { login, register, loading, error } = useAuthStore()
  const [form] = Form.useForm()

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      if (isLogin) {
        await login(values.email, values.password)
        message.success(t('login.loginSuccess'))
      } else {
        await register(values.email, values.password)
        message.success(t('login.registerSuccess'))
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('login.operationFailed'))
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>{t('login.title')}</h1>
          <p>{t('login.version')}</p>
        </div>
        
        <Tabs
          className="login-tabs"
          activeKey={isLogin ? 'login' : 'register'}
          onChange={(key) => setIsLogin(key === 'login')}
          items={[
            {
              key: 'login',
              label: t('common.login'),
            },
            {
              key: 'register',
              label: t('common.register'),
            },
          ]}
        />

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('login.emailRequired') },
              { type: 'email', message: t('login.emailInvalid') }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('common.email')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('login.passwordRequired') },
              { min: 6, message: t('login.passwordMinLength') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('common.password')}
            />
          </Form.Item>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              {isLogin ? t('common.login') : t('common.register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>{t('login.copyright')}</p>
          <p>{t('login.website')}</p>
        </div>
      </Card>
    </div>
  )
}

