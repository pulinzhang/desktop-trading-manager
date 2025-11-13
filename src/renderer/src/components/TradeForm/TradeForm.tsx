import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, DatePicker, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useTradeStore } from '../../store/useTradeStore'
import type { Trade } from '../../../../types'

interface TradeFormProps {
  open: boolean
  trade?: Trade | null
  onCancel: () => void
  onSuccess: () => void
}

export function TradeForm({ open, trade, onCancel, onSuccess }: TradeFormProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const { addTrade, updateTrade } = useTradeStore()

  useEffect(() => {
    if (open) {
      if (trade) {
        form.setFieldsValue({
          ...trade,
          entry_time: trade.entry_time ? dayjs(trade.entry_time) : undefined,
          exit_time: trade.exit_time ? dayjs(trade.exit_time) : undefined
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          entry_time: dayjs(),
          status: 'open'
        })
      }
    }
  }, [open, trade, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const tradeData = {
        ...values,
        entry_time: values.entry_time ? (values.entry_time as Dayjs).format('YYYY-MM-DD HH:mm:ss') : new Date().toISOString(),
        exit_time: values.exit_time ? (values.exit_time as Dayjs).format('YYYY-MM-DD HH:mm:ss') : null
      }

      if (trade) {
        await updateTrade(trade.id, tradeData)
        message.success(t('trade.tradeUpdated'))
      } else {
        await addTrade(tradeData)
        message.success(t('trade.tradeCreated'))
      }
      form.resetFields()
      onSuccess()
    } catch (error) {
      message.error(t('trade.operationFailed'))
    }
  }

  return (
    <Modal
      title={trade ? t('trade.editTrade') : t('trade.newTrade')}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t('trade.symbol')}
          name="symbol"
          rules={[{ required: true, message: t('trade.symbolRequired') }]}
        >
          <Input placeholder={t('trade.symbolPlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('trade.direction')}
          name="direction"
          rules={[{ required: true, message: t('trade.directionRequired') }]}
        >
          <Select placeholder={t('trade.directionPlaceholder')}>
            <Select.Option value="long">{t('trade.long')}</Select.Option>
            <Select.Option value="short">{t('trade.short')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('trade.quantity')}
          name="quantity"
          rules={[{ required: true, message: t('trade.quantityRequired') }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('trade.quantityPlaceholder')}
            min={0}
            precision={0}
          />
        </Form.Item>

        <Form.Item
          label={t('trade.entryPrice')}
          name="entry_price"
          rules={[{ required: true, message: t('trade.entryPriceRequired') }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('trade.entryPricePlaceholder')}
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label={t('trade.exitPrice')}
          name="exit_price"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('trade.exitPricePlaceholder')}
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label={t('trade.entryTime')}
          name="entry_time"
          rules={[{ required: true, message: t('trade.entryTimeRequired') }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          label={t('trade.exitTime')}
          name="exit_time"
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          label={t('trade.status')}
          name="status"
          rules={[{ required: true, message: t('trade.statusRequired') }]}
        >
          <Select placeholder={t('trade.statusPlaceholder')}>
            <Select.Option value="open">{t('trade.open')}</Select.Option>
            <Select.Option value="closed">{t('trade.closed')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('trade.profitLoss')}
          name="profit_loss"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('trade.profitLossPlaceholder')}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label={t('trade.riskAmount')}
          name="risk_amount"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('trade.riskAmountPlaceholder')}
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label={t('trade.notes')}
          name="notes"
        >
          <Input.TextArea rows={3} placeholder={t('trade.notesPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

