import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export function StarDisplay({ score = 0, size = 14 }) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= score ? '#facc15' : '#d1d5db' }}>★</Text>
      ))}
    </View>
  )
}

export function StarPicker({ value, onChange }) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)}>
          <Text style={{ fontSize: 32, color: i <= value ? '#facc15' : '#d1d5db' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const s = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } })
