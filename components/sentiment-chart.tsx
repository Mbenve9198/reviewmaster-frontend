"use client"

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const generateDummyData = () => {
  return Array.from({ length: 30 }, () => Math.floor(Math.random() * 5) + 1)
}

export function SentimentChart() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        if (chartInstance.current) {
          chartInstance.current.destroy()
        }

        const labels = Array.from({ length: 30 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (29 - i))
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Sentiment Score',
              data: generateDummyData(),
              borderColor: '#58CC02',
              backgroundColor: 'rgba(88, 204, 2, 0.1)',
              fill: true,
              tension: 0.4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                type: 'category',
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                  stepSize: 1,
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="w-full h-[300px]">
      <canvas ref={chartRef} />
    </div>
  )
}

