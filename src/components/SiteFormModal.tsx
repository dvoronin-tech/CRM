import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { FIELD_LIMIT, validateSiteFields } from '../domain/fields';
import { ErrorText } from './PageStatus';

type SiteFormModalProps = {
  opened: boolean;
  mode: 'create' | 'edit';
  formKey: string;
  initialName: string;
  initialAddress: string;
  onClose: () => void;
  onSubmit: (name: string, address: string) => Promise<string | null>;
};

export function SiteFormModal({
  opened,
  mode,
  formKey,
  initialName,
  initialAddress,
  onClose,
  onSubmit,
}: SiteFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={mode === 'create' ? 'Новый объект' : 'Изменить объект'}>
      {opened ? (
        <SiteForm
          key={formKey}
          initialName={initialName}
          initialAddress={initialAddress}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

function SiteForm({
  initialName,
  initialAddress,
  onClose,
  onSubmit,
}: {
  initialName: string;
  initialAddress: string;
  onClose: () => void;
  onSubmit: (name: string, address: string) => Promise<string | null>;
}) {
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    const nextAddress = address.trim();
    const validation = validateSiteFields(nextName, nextAddress);
    if (validation) {
      setError(validation);
      return;
    }

    setPending(true);
    const submitError = await onSubmit(nextName, nextAddress);
    setPending(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <Stack gap="md">
        <TextInput
          label="Название"
          name="name"
          required
          maxLength={FIELD_LIMIT.siteName}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput
          label="Адрес"
          name="address"
          required
          maxLength={FIELD_LIMIT.address}
          value={address}
          onChange={(event) => setAddress(event.currentTarget.value)}
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Group justify="flex-end" gap="sm">
          <Button type="button" variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={pending}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
