import { Link } from 'expo-router';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { registrarSchema, RegistrarFormData } from '@/src/schemas/authSchemas';
import { useRegistrar } from '@/src/hooks/useAuth';
import { useCidades } from '@/src/hooks/useLocalizacao';
import { Cidade } from '@/src/types/localizacao';

const UFS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export default function CadastroScreen() {
  const { mutate: registrar, isPending } = useRegistrar();

  const [ufSelecionada, setUfSelecionada] = useState<string | null>(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<Cidade | null>(null);
  const [modalUfVisible, setModalUfVisible] = useState(false);
  const [modalCidadeVisible, setModalCidadeVisible] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [searchUf, setSearchUf] = useState('');
  const [searchCidade, setSearchCidade] = useState('');

  const { data: cidades, isLoading: isLoadingCidades } = useCidades(ufSelecionada || '');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrarFormData>({
    resolver: zodResolver(registrarSchema),
    defaultValues: {
      nome: '',
      celular: '',
      senha: '',
      confirmarSenha: '',
      uf: '',
      cidadeIbgeId: 0,
      cidadeNome: '',
      bairro: '',
    },
  });

  const filteredUfs = useMemo(() => {
    if (!searchUf.trim()) return UFS;
    const search = searchUf.toLowerCase();
    return UFS.filter(
      (uf) =>
        uf.nome.toLowerCase().includes(search) ||
        uf.sigla.toLowerCase().includes(search)
    );
  }, [searchUf]);

  const filteredCidades = useMemo(() => {
    if (!cidades) return [];
    if (!searchCidade.trim()) return cidades;
    const search = searchCidade.toLowerCase();
    return cidades.filter((cidade) => cidade.nome.toLowerCase().includes(search));
  }, [cidades, searchCidade]);

  const onSubmit = (data: RegistrarFormData) => {
    registrar({
      nome: data.nome,
      celular: data.celular,
      senha: data.senha,
      uf: data.uf,
      cidadeIbgeId: data.cidadeIbgeId,
      cidadeNome: data.cidadeNome,
      bairro: data.bairro,
    });
  };

  const handleSelectUf = (uf: string) => {
    setUfSelecionada(uf);
    setCidadeSelecionada(null);
    setValue('uf', uf);
    setValue('cidadeIbgeId', 0);
    setValue('cidadeNome', '');
    setModalUfVisible(false);
    setSearchUf('');
  };

  const handleSelectCidade = (cidade: Cidade) => {
    setCidadeSelecionada(cidade);
    setValue('cidadeIbgeId', cidade.id);
    setValue('cidadeNome', cidade.nome);
    setModalCidadeVisible(false);
    setSearchCidade('');
  };

  const openCidadeModal = () => {
    if (ufSelecionada) {
      setSearchCidade('');
      setModalCidadeVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.logoGradient}
              >
                <Ionicons name="briefcase" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para começar
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="nome"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.nome && styles.inputError]}
                      placeholder="Digite seu nome"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.nome && (
                <Text style={styles.errorText}>{errors.nome.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Celular</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="celular"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.celular && styles.inputError]}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      maxLength={11}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.celular && (
                <Text style={styles.errorText}>{errors.celular.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="senha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.passwordInput, errors.senha && styles.inputError]}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showSenha}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowSenha(!showSenha)}
                >
                  <Ionicons
                    name={showSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.senha && (
                <Text style={styles.errorText}>{errors.senha.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="confirmarSenha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.passwordInput, errors.confirmarSenha && styles.inputError]}
                      placeholder="Repita a senha"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmarSenha}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}
                >
                  <Ionicons
                    name={showConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmarSenha && (
                <Text style={styles.errorText}>{errors.confirmarSenha.message}</Text>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Localização</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estado</Text>
              <TouchableOpacity
                style={[styles.selectButton, errors.uf && styles.selectError]}
                onPress={() => {
                  setSearchUf('');
                  setModalUfVisible(true);
                }}
              >
                <Ionicons name="location-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Text style={ufSelecionada ? styles.selectText : styles.selectPlaceholder}>
                  {ufSelecionada
                    ? UFS.find((u) => u.sigla === ufSelecionada)?.nome
                    : 'Selecione o estado'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {errors.uf && (
                <Text style={styles.errorText}>{errors.uf.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cidade</Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  errors.cidadeIbgeId && styles.selectError,
                  !ufSelecionada && styles.selectDisabled,
                ]}
                onPress={openCidadeModal}
                disabled={!ufSelecionada}
              >
                <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                {isLoadingCidades ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Text style={cidadeSelecionada ? styles.selectText : styles.selectPlaceholder}>
                    {cidadeSelecionada ? cidadeSelecionada.nome : 'Selecione a cidade'}
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>
              {errors.cidadeIbgeId && (
                <Text style={styles.errorText}>{errors.cidadeIbgeId.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bairro</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="home-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="bairro"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.bairro && styles.inputError]}
                      placeholder="Digite seu bairro"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.bairro && (
                <Text style={styles.errorText}>{errors.bairro.message}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isPending && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Criar conta</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Estado */}
      <Modal visible={modalUfVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o estado</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalUfVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                placeholderTextColor="#9ca3af"
                value={searchUf}
                onChangeText={setSearchUf}
                autoFocus
              />
              {searchUf.length > 0 && (
                <TouchableOpacity onPress={() => setSearchUf('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredUfs}
              keyExtractor={(item) => item.sigla}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    ufSelecionada === item.sigla && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectUf(item.sigla)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      ufSelecionada === item.sigla && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <Text style={styles.modalItemSigla}>{item.sigla}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>Nenhum estado encontrado</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Cidade */}
      <Modal visible={modalCidadeVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a cidade</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalCidadeVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar cidade..."
                placeholderTextColor="#9ca3af"
                value={searchCidade}
                onChangeText={setSearchCidade}
                autoFocus
              />
              {searchCidade.length > 0 && (
                <TouchableOpacity onPress={() => setSearchCidade('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredCidades}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    cidadeSelecionada?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectCidade(item)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      cidadeSelecionada?.id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>Nenhuma cidade encontrada</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  selectError: {
    borderColor: '#ef4444',
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalItemSigla: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9ca3af',
  },
});
