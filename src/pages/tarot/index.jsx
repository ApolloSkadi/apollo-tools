import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { shuffleDeck, interpretFortune } from '../../utils/tarot'
import { cardFaceUri } from '../../utils/tarotArt'
import './index.scss'

const PHASE_LABEL = { past: '过去', present: '现在', future: '未来' }
const PHASE_SUBTITLE = {
  past: '选择一张牌，代表你的过去',
  present: '选择一张牌，代表你的现在',
  future: '选择一张牌，代表你的未来',
}
const PHASE_ORDER = ['past', 'present', 'future']

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

function Tarot() {
  const addHistory = useAppStore((state) => state.addHistory)

  /* ---- State ---- */
  const [phase, setPhase] = useState('past')          // 'past' | 'present' | 'future' | 'result'
  const [selectState, setSelectState] = useState('browsing') // 'browsing' | 'selected' | 'animating'
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [displaySlots, setDisplaySlots] = useState(() => shuffleDeck()) // length 22, null where picked
  const [picks, setPicks] = useState([null, null, null])  // [past, present, future]
  const [result, setResult] = useState(null)

  /* ---- Flip animation state ---- */
  const [flipStage, setFlipStage] = useState('none')   // 'none' | 'out' | 'in'
  const [flipCard, setFlipCard] = useState(null)        // the card being flipped (for face display)
  const [slotAnimIndex, setSlotAnimIndex] = useState(-1) // which slot (0/1/2) is entering

  /* ---- Timer refs ---- */
  const timers = useRef([])

  const cleanupTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    return cleanupTimers
  }, [cleanupTimers])

  /* ---- Card tap: highlight / deselect ---- */
  const handleCardTap = useCallback((index) => {
    if (selectState === 'animating') return
    if (displaySlots[index] === null) return // empty position

    if (selectedIndex === index) {
      // Deselect
      setSelectedIndex(null)
      setSelectState('browsing')
    } else {
      // Select / switch selection
      setSelectedIndex(index)
      setSelectState('selected')
    }
  }, [selectState, selectedIndex, displaySlots])

  /* ---- Confirm selection: animate card flip → slot entrance → advance phase ---- */
  const confirmSelection = useCallback(() => {
    if (selectState !== 'selected' || selectedIndex === null) return
    const card = displaySlots[selectedIndex]
    if (!card) return

    setSelectState('animating')
    setFlipStage('out')
    setFlipCard(card)

    cleanupTimers()

    // Step 1: Flip out (250ms)
    timers.current.push(setTimeout(() => {
      setFlipStage('in')

      // Step 2: Flip in complete, move to slot (300ms for flipIn animation)
      timers.current.push(setTimeout(() => {
        const slotIndex = PHASE_ORDER.indexOf(phase)
        const nextPicks = [...picks]
        nextPicks[slotIndex] = card
        setPicks(nextPicks)

        // Empty the deck position
        const nextSlots = [...displaySlots]
        nextSlots[selectedIndex] = null
        setDisplaySlots(nextSlots)

        // Reset flip state, start slot animation
        setFlipStage('none')
        setFlipCard(null)
        setSlotAnimIndex(slotIndex)

        // Step 3: After slot enter animation completes (500ms), advance phase
        timers.current.push(setTimeout(() => {
          setSlotAnimIndex(-1)

          if (phase === 'past') {
            setPhase('present')
            setSelectState('browsing')
            setSelectedIndex(null)
          } else if (phase === 'present') {
            setPhase('future')
            setSelectState('browsing')
            setSelectedIndex(null)
          } else {
            // phase === 'future' — compute result
            const nextPicksFinal = nextPicks
            const interpretation = interpretFortune(
              nextPicksFinal[0],
              nextPicksFinal[1],
              nextPicksFinal[2]
            )
            setResult(interpretation)
            setPhase('result')
            setSelectState('browsing')

            addHistory('tarot', {
              title: `${nextPicksFinal[0].name} / ${nextPicksFinal[1].name} / ${nextPicksFinal[2].name}`,
              detail: interpretation.summary,
              payload: {
                past: nextPicksFinal[0],
                present: nextPicksFinal[1],
                future: nextPicksFinal[2],
                summary: interpretation.summary,
              },
            })
          }
        }, 500))
      }, 300))
    }, 250))
  }, [selectState, selectedIndex, displaySlots, phase, picks, addHistory, cleanupTimers])

  /* ---- Reset ---- */
  const reset = useCallback(() => {
    cleanupTimers()
    setPhase('past')
    setSelectState('browsing')
    setSelectedIndex(null)
    setDisplaySlots(shuffleDeck())
    setPicks([null, null, null])
    setResult(null)
    setFlipStage('none')
    setFlipCard(null)
    setSlotAnimIndex(-1)
  }, [cleanupTimers])

  const isAnimating = selectState === 'animating'
  const phaseIndex = PHASE_ORDER.indexOf(phase)
  const remaining = displaySlots.filter(Boolean).length

  /* ---- Render helpers ---- */

  const renderSlotCard = (slotIndex) => {
    const card = picks[slotIndex]
    const isEntering = slotAnimIndex === slotIndex
    const isResult = phase === 'result'

    if (!card) {
      return (
        <View className={`tarot-slot__card tarot-slot__card--empty ${isEntering ? 'tarot-slot__card--enter' : ''}`}>
          <View className='tarot-slot__placeholder'>?</View>
        </View>
      )
    }

    return (
      <View className={`tarot-slot__card tarot-slot__card--filled ${isEntering ? 'tarot-slot__card--enter' : ''} ${isResult ? 'tarot-slot__card--reveal' : ''}`}
        style={{
          backgroundImage: `url("${cardFaceUri(card.id)}")`,
          backgroundSize: '100% 100%',
          ...(isResult ? { animationDelay: `${slotIndex * 150}ms` } : {}),
        }}
      >
        <View className='tarot-slot__number'>{ROMAN[card.id]}</View>
        <View className='tarot-slot__divider' />
        <View className='tarot-slot__name'>{card.name}</View>
      </View>
    )
  }

  const renderDeckCard = (card, index) => {
    if (!card) {
      return <View className='tarot-card tarot-card--emptied' key={index} />
    }

    const isSelected = selectedIndex === index && selectState === 'selected'
    const isFlipping = selectedIndex === index && isAnimating

    let cardClass = 'tarot-card'
    if (isSelected && !isFlipping) cardClass += ' tarot-card--selected'
    if (isFlipping && flipStage === 'out') cardClass += ' tarot-card--flipping'
    if (isFlipping && flipStage === 'in') cardClass += ' tarot-card--flipping-in'

    // During flip-in, show card face; otherwise show card back
    const showFace = isFlipping && flipStage === 'in'

    return (
      <View
        className={cardClass}
        key={index}
        onClick={() => handleCardTap(index)}
      >
        {showFace ? (
          <View
            className='tarot-card__face'
            style={{ backgroundImage: `url("${cardFaceUri(card.id)}")`, backgroundSize: '100% 100%' }}
          >
            <View className='tarot-card__face-number'>{ROMAN[card.id]}</View>
            <View className='tarot-card__face-name'>{card.name}</View>
            <View className='tarot-card__face-divider' />
          </View>
        ) : (
          <View className='tarot-card__back'>
            <View className='tarot-card__back-inner' />
          </View>
        )}
      </View>
    )
  }

  return (
    <View className='page'>
      {/* ---- Hero ---- */}
      <View className='tarot-hero'>
        <View className='title'>今日运势</View>
        {phase !== 'result' ? (
          <>
            <View className='subtitle'>{PHASE_SUBTITLE[phase]}</View>
            <View className='tarot-progress'>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className={`tarot-progress__dot ${i < phaseIndex ? 'tarot-progress__dot--done' : ''} ${i === phaseIndex ? 'tarot-progress__dot--active' : ''}`}
                />
              ))}
            </View>
            <View className='tarot-hero__phase' style='margin-top: 10px'>
              阶段 {phaseIndex + 1}/3 · {PHASE_LABEL[phase]}
            </View>
          </>
        ) : (
          <View className='subtitle'>运势解读</View>
        )}
      </View>

      {/* ---- Slots ---- */}
      <View className='tarot-slots'>
        {[0, 1, 2].map((i) => (
          <View className='tarot-slot' key={i}>
            {renderSlotCard(i)}
            <View className='tarot-slot__label'>{PHASE_LABEL[PHASE_ORDER[i]]}</View>
          </View>
        ))}
      </View>

      {/* ---- Deck Area ---- */}
      {phase !== 'result' && (
        <>
          <View className='tarot-deck-area'>
            <View className='tarot-deck-label'>
              剩余 {remaining} 张牌 · 左右滑动浏览
            </View>
            <ScrollView
              className='tarot-deck-scroll'
              scrollX
              enhanced
              showScrollbar={false}
            >
              <View className='tarot-deck-inner'>
                {displaySlots.map((card, index) => renderDeckCard(card, index))}
              </View>
            </ScrollView>
          </View>

          {/* ---- Actions ---- */}
          <View className='tarot-actions'>
            <Button
              block
              type='primary'
              disabled={selectState !== 'selected'}
              loading={isAnimating}
              onClick={confirmSelection}
            >
              {isAnimating ? '确认中…' : '确认选择'}
            </Button>
            <View className='tarot-actions__hint'>
              {selectState === 'browsing' && '请点击一张卡牌选中，再确认'}
              {selectState === 'selected' && `已选中第 ${selectedIndex !== null ? selectedIndex + 1 : ''} 张牌，点击确认或换选其他牌`}
              {isAnimating && '卡牌解读中…'}
            </View>
          </View>
        </>
      )}

      {/* ---- Result ---- */}
      {phase === 'result' && result && (
        <View className={`tarot-result tarot-result--enter`}>
          <View className='panel'>
            <View className='result-title'>运势解读</View>
            <View className='tarot-result__triple'>
              {PHASE_ORDER.map((key, i) => {
                const card = result[key]
                const label = PHASE_LABEL[key]
                const meaning = key === 'past' ? card.past : key === 'present' ? card.present : card.future
                return (
                  <View className='tarot-result__position' key={key}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <View className='tarot-result__position-label'>{label} · {card.name}</View>
                    <View className='result-text'>{meaning}</View>
                  </View>
                )
              })}
            </View>
            <View className='result-text' style='margin-top: 14px; white-space: pre-line'>
              {result.summary}
            </View>
            <Button block type='primary' onClick={reset} style='margin-top: 16px'>
              重新占卜
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default Tarot
