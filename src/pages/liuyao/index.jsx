import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { calculateLiuYao, createRandomYao } from '../../utils/divination'
import './index.scss'

const yaoValues = [6, 7, 8, 9]
const yaoNames = {
  6: '老阴',
  7: '少阳',
  8: '少阴',
  9: '老阳',
}

/* Decompose a yao value (6-9) into 3 coin faces (2=反面, 3=正面).
   Coin order is shuffled so the same yao value can show different patterns. */
const decomposeYao = (yao) => {
  const map = {
    6: [2, 2, 2],
    7: [2, 2, 3],
    8: [2, 3, 3],
    9: [3, 3, 3],
  }
  const coins = [...map[yao]]
  // Shuffle for visual variety (only meaningful for 7 and 8)
  for (let i = coins.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[coins[i], coins[j]] = [coins[j], coins[i]]
  }
  return coins
}

const coinLabel = (v) => (v === 3 ? '正' : '反')

function LiuYao() {
  const addHistory = useAppStore((state) => state.addHistory)
  const [lines, setLines] = useState(Array(6).fill(null))
  const [result, setResult] = useState(null)
  const filledCount = lines.filter((line) => line).length

  /* ---- coin animation state ---- */
  const [coinPhase, setCoinPhase] = useState('idle') // 'idle' | 'flipping' | 'settling' | 'done'
  const [coinTargets, setCoinTargets] = useState([2, 2, 2])  // final coin values
  const [coinDisplay, setCoinDisplay] = useState([2, 2, 2])   // currently shown values
  const [coinSettled, setCoinSettled] = useState([false, false, false])
  const [pendingYao, setPendingYao] = useState(null)          // yao value to apply
  const [pendingIndex, setPendingIndex] = useState(-1)         // line index to fill
  const flipInterval = useRef(null)
  const settleTimers = useRef([])

  /* ---- multi-line (randomAll) animation ---- */
  const [batchLines, setBatchLines] = useState(null)          // all 6 lines being revealed
  const [batchRevealed, setBatchRevealed] = useState(0)        // how many have been revealed

  const cleanupTimers = useCallback(() => {
    if (flipInterval.current) {
      clearInterval(flipInterval.current)
      flipInterval.current = null
    }
    settleTimers.current.forEach(clearTimeout)
    settleTimers.current = []
  }, [])

  useEffect(() => {
    return cleanupTimers
  }, [cleanupTimers])

  /* Animate 3 coins flipping, then settle to reveal a yao value */
  const animateCoins = useCallback((yaoValue, lineIndex) => {
    cleanupTimers()
    const targets = decomposeYao(yaoValue)
    setCoinTargets(targets)
    setCoinDisplay([2, 2, 2])
    setCoinSettled([false, false, false])
    setPendingYao(yaoValue)
    setPendingIndex(lineIndex)
    setCoinPhase('flipping')

    // Rapid flip: cycle random coin values every 80ms for ~900ms
    const start = Date.now()
    flipInterval.current = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= 900) {
        clearInterval(flipInterval.current)
        flipInterval.current = null
        // Settle coins one by one
        setCoinPhase('settling')
        targets.forEach((_, i) => {
          settleTimers.current.push(setTimeout(() => {
            setCoinDisplay((prev) => {
              const next = [...prev]
              next[i] = targets[i]
              return next
            })
            setCoinSettled((prev) => {
              const next = [...prev]
              next[i] = true
              return next
            })
            // Last coin settled → apply the yao line
            if (i === targets.length - 1) {
              settleTimers.current.push(setTimeout(() => {
                setCoinPhase('done')
                if (lineIndex >= 0) {
                  setLines((prev) => {
                    const next = [...prev]
                    next[lineIndex] = yaoValue
                    return next
                  })
                }
              }, 250))
            }
          }, i * 200))
        })
      } else {
        // Randomize display during flip
        setCoinDisplay([2, 3, 2].map(() => (Math.random() > 0.5 ? 3 : 2)))
      }
    }, 80)
  }, [cleanupTimers])

  /* Animate a batch reveal for randomAll */
  const animateBatch = useCallback((nextLines) => {
    cleanupTimers()
    setBatchLines(nextLines)
    setBatchRevealed(0)
    setCoinPhase('flipping')

    // Reveal lines one by one with stagger
    nextLines.forEach((yaoValue, i) => {
      const delay = i * 180
      settleTimers.current.push(setTimeout(() => {
        setBatchRevealed((prev) => prev + 1)
        setLines((prev) => {
          const next = [...prev]
          next[i] = yaoValue
          return next
        })
        // Last line revealed → compute result
        if (i === nextLines.length - 1) {
          settleTimers.current.push(setTimeout(() => {
            const liuyaoResult = calculateLiuYao(nextLines)
            setResult(liuyaoResult)
            setCoinPhase('idle')
            addHistory('liuyao', { title: liuyaoResult.originalHexagram.name, detail: liuyaoResult.summary })
          }, 250))
        }
      }, delay))
    })
  }, [cleanupTimers, addHistory])

  const shakeOne = () => {
    if (coinPhase !== 'idle') return
    const emptyIndex = lines.findIndex((line) => !line)
    if (emptyIndex === -1) return
    const yaoValue = createRandomYao()
    animateCoins(yaoValue, emptyIndex)
  }

  const randomAll = () => {
    if (coinPhase !== 'idle') return
    const nextLines = Array.from({ length: 6 }, createRandomYao)
    animateBatch(nextLines)
  }

  const generate = () => {
    if (filledCount !== 6) return
    const next = calculateLiuYao(lines)
    setResult(next)
    addHistory('liuyao', { title: next.originalHexagram.name, detail: next.summary })
  }

  const reset = () => {
    cleanupTimers()
    setLines(Array(6).fill(null))
    setResult(null)
    setCoinPhase('idle')
    setBatchLines(null)
    setBatchRevealed(0)
  }

  const changeLine = (index, value) => {
    const next = [...lines]
    next[index] = value
    setLines(next)
    setResult(null)
  }

  const isAnimating = coinPhase === 'flipping' || coinPhase === 'settling'

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>六爻</View>
        <View className='subtitle'>自下而上生成六爻，可手动摇一爻，也可一键随机起卦。</View>
      </View>

      <View className='panel'>
        <View className='row-wrap'>
          <Button type='primary' onClick={shakeOne} disabled={filledCount >= 6 || isAnimating}>手动摇一爻</Button>
          <Button type='success' fill='outline' onClick={randomAll} disabled={isAnimating}>随机起卦</Button>
          <Button fill='outline' onClick={reset} disabled={isAnimating}>重置</Button>
        </View>
        <View className='muted liuyao-tip'>当前已生成 {filledCount}/6 爻</View>
      </View>

      {/* ---- Coin animation area ---- */}
      {(coinPhase === 'flipping' || coinPhase === 'settling') && (
        <View className='coin-stage'>
          <View className='coin-stage__hint'>
            {coinPhase === 'flipping' ? '摇币中…' : '定爻中…'}
          </View>
          <View className='coin-tray'>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`coin ${coinPhase === 'settling' && coinSettled[i] ? 'coin--settled' : ''} ${coinPhase === 'flipping' ? 'coin--flipping' : ''}`}
              >
                <View className='coin__face'>
                  <View className='coin__value'>{coinLabel(coinDisplay[i])}</View>
                </View>
                {coinPhase === 'settling' && coinSettled[i] && (
                  <View className='coin__yao-label'>{coinDisplay[i] === 3 ? '阳' : '阴'}</View>
                )}
              </View>
            ))}
          </View>
          {coinPhase === 'settling' && coinSettled.every(Boolean) && pendingYao !== null && (
            <View className='coin-result'>
              <View className='coin-result__sum'>{pendingYao}</View>
              <View className='coin-result__name'>{yaoNames[pendingYao]}</View>
            </View>
          )}
        </View>
      )}
      {/* coinPhase === 'done' → brief flash, then clear */}
      {coinPhase === 'done' && (
        <View className='coin-stage coin-stage--done'>
          <View className='coin-tray'>
            {[0, 1, 2].map((i) => (
              <View key={i} className='coin coin--settled coin--done'>
                <View className='coin__face'>
                  <View className='coin__value'>{coinLabel(coinTargets[i])}</View>
                </View>
              </View>
            ))}
          </View>
          <View className='coin-result coin-result--done'>
            <View className='coin-result__sum'>{pendingYao}</View>
            <View className='coin-result__name'>{yaoNames[pendingYao]}</View>
          </View>
        </View>
      )}

      {/* ---- Hexagram lines ---- */}
      <View className='hexagram-panel'>
        {Array.from({ length: 6 }).map((_, reverseIndex) => {
          const index = 5 - reverseIndex
          const value = lines[index]
          const isYang = value === 7 || value === 9
          const isNew = batchLines !== null && index < batchRevealed && value !== null
          return (
            <View className={`yao-row ${isNew ? 'yao-row--reveal' : ''}`} key={index}>
              <View className='yao-index'>第 {index + 1} 爻</View>
              <View className={`yao-line ${isYang ? 'yang' : 'yin'} ${value ? '' : 'empty'}`}>
                <View />
                {!isYang && <View />}
              </View>
              <View className='yao-actions'>
                {yaoValues.map((item) => (
                  <Button
                    key={item}
                    size='small'
                    type={value === item ? 'primary' : 'default'}
                    fill={value === item ? 'solid' : 'outline'}
                    onClick={() => changeLine(index, item)}
                  >
                    {yaoNames[item]}
                  </Button>
                ))}
              </View>
            </View>
          )
        })}
      </View>

      <Button block type='primary' disabled={filledCount !== 6} onClick={generate}>生成卦象</Button>

      {result && (
        <View className='panel'>
          <View className='result-title'>{result.originalHexagram.name}</View>
          <View className='result-text'>本卦：{result.originalHexagram.text}，{result.originalHexagram.note}</View>
          <View className='result-text'>变卦：{result.changedHexagram.name}（{result.changedHexagram.text}）</View>
          <View className='result-text'>动爻：{result.changedLines.length ? `第 ${result.changedLines.join('、')} 爻` : '无'}</View>
          <View className='result-text'>六爻：{result.lineLabels.join('、')}</View>
          <View className='result-text'>解释：{result.summary}</View>
        </View>
      )}
    </View>
  )
}

export default LiuYao
