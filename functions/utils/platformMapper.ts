
export function mapDeviceTypes(deviceTypes: string[]) {
    return deviceTypes.map(type =>
        type.includes('Android') ? 'android'
            : type.includes('IOS') ? 'ios'
                : 'web'
    );
};

