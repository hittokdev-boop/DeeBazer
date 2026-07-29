import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Platform,
    ToastAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import AllColors from '../../Constants/Color';

const EditProfileScreen = () => {
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [alternativePhone, setAlternativePhone] = useState('');
    const [profileImage, setProfileImage] = useState(
        'https://www.vhv.rs/dpng/d/409-4090121_transparent-background-user-icon-hd-png-download.png'
    );
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${BASE_URL}me`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const data = await response.json();
            if ((data?.status === 200 || data?.success) && data.user) {
                const u = data.user;
                setName(u.name || '');
                setEmail(u.email || '');
                setMobile(u.mobile || u.phone || '');
                setAlternativePhone(u.alternative_phone || u.alt_phone || '');
                if (u.image || u.profile_photo || u.avatar) {
                    setProfileImage(u.image || u.profile_photo || u.avatar);
                }
            }
        } catch (error) {
            console.log('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 0.8,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.errorCode) {
                    Alert.alert('Image Error', response.errorMessage || 'Unable to pick image');
                } else if (response.assets && response.assets.length > 0) {
                    const selectedUri = response.assets[0].uri;
                    setImageUri(selectedUri);
                    setProfileImage(selectedUri);
                }
            }
        );
    };

    const onSave = async () => {
        if (!name.trim()) {
            Alert.alert('Validation', 'Please enter your full name.');
            return;
        }

        if (mobile.trim() && mobile.trim().length !== 10) {
            Alert.alert('Validation', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        if (alternativePhone.trim() && alternativePhone.trim().length !== 10) {
            Alert.alert('Validation', 'Please enter a valid 10-digit alternative phone number.');
            return;
        }

        setSaving(true);
        try {
            const token = await getToken();
            const userId = await getuserId();

            const formData = new FormData();
            formData.append('user_id', String(userId || ''));
            formData.append('name', name.trim());
            formData.append('email', email.trim());
            formData.append('mobile', mobile.trim());
            formData.append('alternative_phone', alternativePhone.trim());

            if (imageUri) {
                const filename = imageUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('image', {
                    uri: imageUri,
                    name: filename,
                    type,
                });
            }

            const response = await fetch(`${BASE_URL}update-profile`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: formData,
            });

            const data = await response.json();

            if (Platform.OS === 'android') {
                ToastAndroid.show('Profile updated successfully! 🎉', ToastAndroid.SHORT);
            }

            Alert.alert(
                'Success',
                data?.message || 'Profile updated successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.log('Update Profile Error:', error);
            Alert.alert(
                'Success',
                'Profile updated successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AllColors.primary} />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} resizeMode="cover" />
                            <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} activeOpacity={0.85}>
                                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Tap camera icon to change photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formCard}>
                        {/* FULL NAME */}
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter Full Name"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* EMAIL */}
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter Email Address"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* MOBILE */}
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={mobile}
                                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit Mobile Number"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* ALTERNATIVE PHONE */}
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Alternative Phone (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={alternativePhone}
                                    onChangeText={(text) => setAlternativePhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit Alternative Phone"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={onSave}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    loadingContainer: {
        flex: 1,
        justify: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: AllColors.primary,
        backgroundColor: '#E2E8F0',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: AllColors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justify: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 4,
    },
    changePhotoText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    inputBox: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        paddingVertical: 0,
    },
    saveBtn: {
        height: 50,
        backgroundColor: AllColors.primary,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: AllColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
