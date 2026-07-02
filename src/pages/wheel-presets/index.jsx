import React, { useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Textarea, View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { defaultWheelOptions, parseWheelPresetGroups, stringifyWheelPresetGroup } from '../../utils/wheelPresets'
import './index.scss'

const emptyOption = (index) => ({ id: `draft-${Date.now()}-${index}`, label: '', weight: 1 })

function WheelPresets() {
  const wheelPresetGroups = useAppStore((state) => state.wheelPresetGroups || [])
  const addWheelPresetGroup = useAppStore((state) => state.addWheelPresetGroup)
  const importWheelPresetGroups = useAppStore((state) => state.importWheelPresetGroups)
  const removeWheelPresetGroup = useAppStore((state) => state.removeWheelPresetGroup)
  const [name, setName] = useState('')
  const [options, setOptions] = useState(defaultWheelOptions.map((item, index) => ({ ...item, id: `draft-${index}` })))
  const [jsonText, setJsonText] = useState('')

  const updateOption = (id, patch) => {
    setOptions((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addOption = () => {
    setOptions((items) => [...items, emptyOption(items.length)])
  }

  const removeOption = (id) => {
    setOptions((items) => items.filter((item) => item.id !== id))
  }

  const saveManual = () => {
    const validOptions = options.filter((item) => item.label.trim() && Number(item.weight) > 0)
    if (!validOptions.length) {
      Taro.showToast({ title: '请至少配置一个选项', icon: 'none' })
      return
    }
    addWheelPresetGroup(name || '本地预设组', validOptions)
    setName('')
    setOptions(defaultWheelOptions.map((item, index) => ({ ...item, id: `draft-${Date.now()}-${index}` })))
    Taro.showToast({ title: '已保存预设组', icon: 'success' })
  }

  const importFromText = (text = jsonText) => {
    try {
      const groups = parseWheelPresetGroups(text)
      if (!groups.length) {
        Taro.showToast({ title: '没有可导入的选项', icon: 'none' })
        return
      }
      importWheelPresetGroups(groups)
      setJsonText('')
      Taro.showToast({ title: `已导入 ${groups.length} 组`, icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: 'JSON 格式不正确', icon: 'none' })
    }
  }

  const uploadJson = async () => {
    try {
      const fileResult = await Taro.chooseMessageFile({ count: 1, type: 'file', extension: ['json'] })
      const file = fileResult.tempFiles?.[0]
      if (!file?.path) return
      const fs = Taro.getFileSystemManager()
      fs.readFile({
        filePath: file.path,
        encoding: 'utf8',
        success: (result) => importFromText(result.data),
        fail: () => Taro.showToast({ title: '读取文件失败', icon: 'none' }),
      })
    } catch (error) {
      Taro.showToast({ title: '未选择文件', icon: 'none' })
    }
  }

  const fillExample = () => {
    setJsonText(stringifyWheelPresetGroup({ name: '午餐选择', options: [
      { label: '面', weight: 1 },
      { label: '饭', weight: 2 },
      { label: '沙拉', weight: 1 },
    ] }))
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>转盘预设组</View>
        <View className='subtitle'>上传 JSON，或在本机手动配置一组常用选项。</View>
      </View>

      <View className='panel'>
        <View className='result-title'>本地配置</View>
        <View className='field preset-field'>
          <View className='label'>预设组名称</View>
          <Input className='input' value={name} placeholder='例如：午餐选择' onInput={(event) => setName(event.detail.value)} />
        </View>
        {options.map((item) => (
          <View className='preset-option-row' key={item.id}>
            <Input
              className='input preset-option-name'
              value={item.label}
              placeholder='选项'
              onInput={(event) => updateOption(item.id, { label: event.detail.value })}
            />
            <Input
              className='input preset-option-weight'
              type='number'
              value={`${item.weight}`}
              onInput={(event) => updateOption(item.id, { weight: Math.max(0, Number(event.detail.value) || 0) })}
            />
            <Button size='small' type='danger' fill='outline' onClick={() => removeOption(item.id)}>删</Button>
          </View>
        ))}
        <View className='row-wrap preset-actions'>
          <Button fill='outline' onClick={addOption}>新增选项</Button>
          <Button type='primary' onClick={saveManual}>保存预设组</Button>
        </View>
      </View>

      <View className='panel'>
        <View className='result-title'>导入 JSON</View>
        <Textarea
          className='textarea preset-json'
          value={jsonText}
          placeholder='粘贴 JSON，支持 { "name": "...", "options": [...] } 或直接粘贴选项数组'
          onInput={(event) => setJsonText(event.detail.value)}
        />
        <View className='row-wrap preset-actions'>
          <Button fill='outline' onClick={fillExample}>填入示例</Button>
          <Button fill='outline' onClick={uploadJson}>上传 JSON</Button>
          <Button type='primary' onClick={() => importFromText()}>导入</Button>
        </View>
      </View>

      <View className='section-title'>已有预设组</View>
      {wheelPresetGroups.length ? (
        wheelPresetGroups.map((group) => (
          <View className='preset-card' key={group.id}>
            <View className='preset-card__header'>
              <View>
                <View className='preset-card__title'>{group.name}</View>
                <View className='preset-card__meta'>{group.options.length} 个选项</View>
              </View>
              <Button size='small' type='danger' fill='outline' onClick={() => removeWheelPresetGroup(group.id)}>删除</Button>
            </View>
            <View className='preset-card__options'>
              {group.options.map((item) => (
                <View className='preset-chip' key={item.id}>{item.label} · {item.weight}</View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View className='empty-state'>暂无预设组</View>
      )}
    </View>
  )
}

export default WheelPresets
