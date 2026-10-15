import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export function OrgEditForm({ organization, onSave, setDirty }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  const [name, setName] = useState(organization?.name || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [description, setDescription] = useState(organization?.description || '');
  const [phone, setPhone] = useState(organization?.phone || '');
  const [website, setWebsite] = useState(organization?.website || '');

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const isDirty = 
      name !== (organization?.name || '') ||
      address !== (organization?.address || '') ||
      description !== (organization?.description || '') ||
      phone !== (organization?.phone || '') ||
      website !== (organization?.website || '');
      
    setDirty(isDirty);
  }, [name, address, description, phone, website, organization, setDirty]);

  const validate = () => {
    let valid = true;
    let errors = {};

    if (!name.trim()) {
      errors.name = t('auth.required_field', 'Required field');
      valid = false;
    }
    
    if (phone && phone.length > 0 && phone.length < 10) {
      errors.phone = t('auth.invalid_format', 'Invalid format');
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        phone: phone.trim(),
        website: website.trim()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>{t('profile.organization_details', 'Organization Details')}</Text>

      <Input
        label={t('profile.org_name', 'Name')}
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: '' }));
        }}
        placeholder={t('profile.org_name', 'Organization name')}
        error={validationErrors.name}
      />

      <Input
        label={t('profile.org_address', 'Address')}
        value={address}
        onChangeText={setAddress}
        placeholder={t('profile.org_address', 'Organization address')}
      />

      <Input
        label={t('profile.org_description', 'Description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('profile.org_description', 'Tell us about your organization')}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={styles.textArea}
      />
      
      <Input
        label={t('profile.phone', 'Phone number')}
        value={phone}
        onChangeText={(text) => {
          let cleaned = text.replace(/[^\d+]/g, '');
          setPhone(cleaned);
          if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
        }}
        placeholder="+1234567890"
        keyboardType="phone-pad"
        error={validationErrors.phone}
      />
      
      <Input
        label={t('profile.website', 'Website')}
        value={website}
        onChangeText={setWebsite}
        placeholder="https://example.com"
        keyboardType="url"
        autoCapitalize="none"
      />

      <Button
        title={t('common.save', 'Save changes')}
        onPress={handleSave}
        disabled={loading}
        loading={loading}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const themeStyles = (theme) => ({
  container: {
    padding: theme.sizes.spacing.xl,
    paddingBottom: theme.sizes.scale(100),
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.s,
  },
  textArea: {
    minHeight: theme.sizes.scale(100),
  },
  saveBtn: {
    marginTop: theme.sizes.spacing.l,
  }
});
