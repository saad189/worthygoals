import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Chip } from '@/models';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ChipsSelectorProps {
    chips: Chip[];
    onSelectionChange: (selectedIds: number[]) => void;
}

const ChipsList: React.FC<ChipsSelectorProps> = ({ chips, onSelectionChange }) => {
    const { colors } = useAppTheme();
    const [selectedChips, setSelectedChips] = useState<number[]>([]);

    const toggleChipSelection = (id: number) => {
        let updatedSelection: number[];
        if (selectedChips.includes(id)) {
            updatedSelection = selectedChips.filter(chipId => chipId !== id);
        } else {
            updatedSelection = [...selectedChips, id];
        }
        setSelectedChips(updatedSelection);
        onSelectionChange(updatedSelection);
    };

    return (
        <View style={staticStyles.container}>
            {chips.map(chip => (
                <TouchableOpacity
                    key={chip.id}
                    style={[
                        staticStyles.chip,
                        { backgroundColor: selectedChips.includes(chip.id) ? colors.textMuted : colors.textInactive },
                    ]}
                    onPress={() => toggleChipSelection(chip.id)}
                >
                    <Text style={[staticStyles.chipText, { color: colors.textWhite }]}>{chip.title}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const staticStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 16,
    },
});

export default ChipsList;
