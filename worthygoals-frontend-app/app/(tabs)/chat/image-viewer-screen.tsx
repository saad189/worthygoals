import React from 'react';
import { useRoute } from '@react-navigation/native';
import ImageViewerModalComponent from '@/components/Common/ImageViewer';
import Background from '@/components/SubComponents/Background';

const ImageViewerModal = () => {
    const { params: { imageUri, tag } } = useRoute() as any;
    return <Background><ImageViewerModalComponent imageUri={imageUri} tag={tag} /></Background>
};

export default ImageViewerModal;
