import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Chip } from '@/models';

interface ChipsSelectorProps {
    chips: Chip[];
    onSelectionChange: (selectedIds: number[]) => void;
}

const ChipsList: React.FC<ChipsSelectorProps> = ({ chips, onSelectionChange }) => {
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
        <View style={styles.container}>
            {chips.map(chip => (
                <TouchableOpacity
                    key={chip.id}
                    style={[
                        styles.chip,
                        selectedChips.includes(chip.id) ? styles.selectedChip : {},
                    ]}
                    onPress={() => toggleChipSelection(chip.id)}
                >
                    <Text style={styles.chipText}>{chip.title}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#555',
    },
    selectedChip: {
        backgroundColor: '#999',
    },
    chipText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default ChipsList;
