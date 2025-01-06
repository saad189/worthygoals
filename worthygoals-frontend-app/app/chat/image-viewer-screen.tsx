import React, { } from 'react';
import { StyleSheet, Dimensions, Pressable } from 'react-native';
const { width, height } = Dimensions.get('window');

import { ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import Animated, { } from 'react-native-reanimated';
import Background from '@/components/SubComponents/Background';

const iconColor = '#FFF';
const ImageViewerModal = () => {
    const { params: { mentor } } = useRoute() as any;
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    return (
        <Background>
            <Pressable onPress={navigation.goBack} style={styles.container}>
                <Animated.Image
                    source={{
                        uri: mentor?.imageUri,
                    }}
                    sharedTransitionTag='tag'
                    style={styles.profileImage}
                />
            </Pressable>
        </Background>
    )
}

export default ImageViewerModal;


const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    profileImage: {
        width,
        height: width,
        resizeMode: 'cover',
    },
});
