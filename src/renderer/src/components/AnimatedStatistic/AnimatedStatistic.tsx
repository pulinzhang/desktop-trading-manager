import { useEffect, useState } from 'react'
import { Statistic } from 'antd'
import type { StatisticProps } from 'antd'
import './AnimatedStatistic.css'

interface AnimatedStatisticProps extends StatisticProps {
  value: number
  duration?: number
}

export function AnimatedStatistic({ value, duration = 800, ...props }: AnimatedStatisticProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      const startValue = displayValue
      const endValue = value
      const startTime = Date.now()

      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = startValue + (endValue - startValue) * easeOutCubic

        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [value, displayValue, duration])

  const formatValue = (val: number) => {
    if (props.precision !== undefined) {
      return Number(val.toFixed(props.precision))
    }
    return Math.round(val)
  }

  return (
    <div className={isAnimating ? 'statistic-animating' : ''}>
      <Statistic
        {...props}
        value={formatValue(displayValue)}
      />
    </div>
  )
}

