import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { chartTick, formatMonthDay } from '../lib/dates';
import { formatNumber } from '../lib/units';
import { colors, type } from '../theme/tokens';
import type { Unit } from '../lib/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  current,
  goal,
  unit,
  percent,
}: {
  current: number;
  goal: number;
  unit: Unit;
  percent: number;
}) {
  const size = 230;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(percent / 100, 1));

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: 700 });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.ringWrap} accessibilityLabel={`${formatNumber(current, unit)} of ${formatNumber(goal, unit)} ${unit}, ${percent} percent`}>
      <View style={styles.ringRotate}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.track} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{formatNumber(current, unit)}</Text>
        <Text style={styles.ringGoal}>{`of ${formatNumber(goal, unit)} ${unit}`}</Text>
        <Text style={styles.ringPercent}>{`${percent}%`}</Text>
      </View>
    </View>
  );
}

export function IntakeChart({
  points,
  goalMl,
  unit,
}: {
  points: { date: Date; ml: number }[];
  goalMl: number;
  unit: Unit;
}) {
  const [width, setWidth] = useState(0);
  const height = 150;
  const axis = 36;
  const max = Math.max(goalMl, ...points.map((point) => point.ml), 1);
  const chartWidth = Math.max(width - axis, 0);
  const slot = points.length ? chartWidth / points.length : 0;
  const barWidth = Math.max(4, Math.min(22, slot * 0.55));

  const ticks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => {
    const value = max * ratio;
    const label = unit === 'ml' ? `${(value / 1000).toFixed(1)}L` : `${Math.round(value)}`;
    return { ratio, label };
  });

  return (
    <View
      style={styles.chart}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel="Intake chart"
    >
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.sky} />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        {ticks.map((tick) => (
          <Rect
            key={tick.label}
            x={axis}
            y={12 + (1 - tick.ratio) * (height - 28)}
            width={chartWidth}
            height={1}
            fill={colors.line}
          />
        ))}
        {points.map((point, index) => {
          const barHeight = Math.max(point.ml > 0 ? 4 : 0, (point.ml / max) * (height - 28));
          const x = axis + index * slot + (slot - barWidth) / 2;
          const y = 12 + (height - 28) - barHeight;
          return <Rect key={point.date.toISOString()} x={x} y={y} width={barWidth} height={barHeight} rx={4} fill="url(#bar)" />;
        })}
      </Svg>
      <View style={styles.yAxis} pointerEvents="none">
        {ticks.map((tick) => (
          <Text key={tick.label} style={styles.yLabel}>{tick.label}</Text>
        ))}
      </View>
      <View style={[styles.xAxis, { marginLeft: axis }]}>
        {points.map((point, index) => (
          <Text key={`${formatMonthDay(point.date)}-${index}`} style={[styles.xLabel, index === points.length - 1 && styles.xLabelLast]}>
            {chartTick(point.date, index, points.length)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignItems: 'center', justifyContent: 'center', height: 240 },
  ringRotate: { transform: [{ rotate: '-90deg' }] },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 46, color: colors.ink },
  ringGoal: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 20, color: colors.muted },
  ringPercent: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22, color: colors.primary, marginTop: 2 },
  chart: { height: 188, marginTop: 8 },
  yAxis: { position: 'absolute', left: 0, top: 6, height: 150, width: 34, justifyContent: 'space-between' },
  yLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 12, color: colors.faint },
  xAxis: { flexDirection: 'row', marginTop: 6 },
  xLabel: { flex: 1, textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.muted },
  xLabelLast: { fontFamily: 'Inter_700Bold', color: colors.ink },
});
