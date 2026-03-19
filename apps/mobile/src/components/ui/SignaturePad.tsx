import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, PanResponder, Dimensions } from 'react-native';

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSignatureChange, width, height = 200 }: SignaturePadProps) {
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<View>(null);
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const canvasWidth = width || Dimensions.get('window').width - 48;

  useEffect(() => {
    onSignatureChange(strokes.length > 0 || currentStroke.length > 0 ? 'signed' : null);
  }, [strokes, currentStroke]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (currentStroke.length > 0) {
          setStrokes(prev => [...prev, currentStroke]);
          setCurrentStroke([]);
        }
      },
    })
  ).current;

  const clearSignature = () => {
    setStrokes([]);
    setCurrentStroke([]);
    onSignatureChange(null);
  };

  const renderStroke = (stroke: { x: number; y: number }[], index: number) => {
    if (stroke.length < 2) return null;

    const pathData = stroke.map((point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    // Simple line rendering using absolute positioning
    return (
      <View key={index} style={StyleSheet.absoluteFill}>
        {stroke.map((point, i) => {
          if (i === 0) return null;
          const prevPoint = stroke[i - 1];
          const dx = point.x - prevPoint.x;
          const dy = point.y - prevPoint.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={i}
              style={[
                styles.strokeSegment,
                {
                  left: prevPoint.x,
                  top: prevPoint.y,
                  width: length,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Sign below</Text>
        <Pressable onPress={clearSignature}>
          <Text style={styles.clearButton}>Clear</Text>
        </Pressable>
      </View>

      <View
        ref={canvasRef}
        style={[styles.canvas, { width: canvasWidth, height }]}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          setCanvasLayout({ x, y, width, height });
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.canvasInner}>
          {strokes.map((stroke, index) => renderStroke(stroke, index))}
          {currentStroke.length > 0 && renderStroke(currentStroke, strokes.length)}
        </View>
        <Text style={styles.placeholder}>Sign here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  clearButton: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  canvas: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvasInner: {
    flex: 1,
  },
  placeholder: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 16,
  },
  strokeSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#0f172a',
    borderRadius: 1.5,
  },
});
