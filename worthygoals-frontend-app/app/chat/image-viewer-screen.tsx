import React from 'react';
import { useRoute } from '@react-navigation/native';
import ImageViewerModalComponent from '@/components/Common/ImageViewer';

const ImageViewerModal = () => {
    const { params: { imageUri, tag } } = useRoute() as any;
    return <ImageViewerModalComponent imageUri={imageUri} tag={tag} />;
};

export default ImageViewerModal;
