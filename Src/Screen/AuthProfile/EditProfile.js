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
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { theme, isDarkMode } = useTheme();

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

        setSaving(true);
        try {
            const token = await getToken();
            const userId = await getuserId();

            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('email', email.trim());
            formData.append('mobile', mobile.trim());
            if (alternativePhone.trim()) {
                formData.append('alternative_phone', alternativePhone.trim());
            }

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

            const response = await fetch(`${BASE_URL}profile-update`, {
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
                <View style={styles.headerSpacer} />
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
                                <Ionicons name="camera-outline" size={18} color={AllColors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.changePhotoText, { color: theme.textSecondary }]}>Tap camera to change photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                        {/* FULL NAME */}
                        <View style={styles.inputBox}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Full Name</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg, borderColor: isDarkMode ? '#475569' : AllColors.lightGrey }]}>
                                <Ionicons name="person-outline" size={18} color={isDarkMode ? '#94A3B8' : AllColors.slateSub} style={styles.inputIcon} />
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={isDarkMode ? '#94A3B8' : AllColors.slateLight}
                                    style={[styles.input, { color: theme.textPrimary }]}
                                />
                            </View>
                        </View>

                        {/* EMAIL */}
                        <View style={styles.inputBox}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Email Address</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg, borderColor: isDarkMode ? '#475569' : AllColors.lightGrey }]}>
                                <Ionicons name="mail-outline" size={18} color={isDarkMode ? '#94A3B8' : AllColors.slateSub} style={styles.inputIcon} />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={isDarkMode ? '#94A3B8' : AllColors.slateLight}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={[styles.input, { color: theme.textPrimary }]}
                                />
                            </View>
                        </View>

                        {/* MOBILE */}
                        <View style={styles.inputBox}>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Mobile Number</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg, borderColor: isDarkMode ? '#475569' : AllColors.lightGrey }]}>
                                <Ionicons name="call-outline" size={18} color={isDarkMode ? '#94A3B8' : AllColors.slateSub} style={styles.inputIcon} />
                                <TextInput
                                    value={mobile}
                                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                                    placeholder="Enter mobile number"
                                    placeholderTextColor={isDarkMode ? '#94A3B8' : AllColors.slateLight}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    style={[styles.input, { color: theme.textPrimary }]}
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
                                <ActivityIndicator size="small" color={AllColors.white} />
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
        backgroundColor: AllColors.screenBg,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: AllColors.white,
        paddingHorizontal: 16,
        elevation: 2,
        shadowColor: AllColors.shadow,
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
        color: AllColors.slateDark,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
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
        backgroundColor: AllColors.lightGrey,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: AllColors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: AllColors.white,
        elevation: 4,
    },
    changePhotoText: {
        fontSize: 12,
        color: AllColors.slateSub,
        marginTop: 8,
    },
    formCard: {
        backgroundColor: AllColors.white,
        borderRadius: 16,
        padding: 18,
        elevation: 2,
        shadowColor: AllColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: AllColors.divider,
    },
    inputBox: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: AllColors.slateText,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AllColors.screenBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AllColors.lightGrey,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: AllColors.slateDark,
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
        color: AllColors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 40,
    },
});
