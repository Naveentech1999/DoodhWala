import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView,
  Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

type Tab = 'Home' | 'Delivery' | 'Customers' | 'Monthly' | 'Bills';
type Customer = { id: string; name: string; active: boolean };
type Product = { id: string; company: string; product_name: string; unit: string; company_mrp: number };
type Entry = { customer_id: string; product_id: string; delivery_date: string; status: string; delivered_quantity: number; unit: string; customer_price: number };
const GREEN = '#16845B';
const INK = '#18332A';
const MUTED = '#718078';
const BG = '#F4F8F5';
const today = () => new Date().toISOString().slice(0, 10);

function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity activeOpacity={0.85}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    if (!supabase) return Alert.alert('Setup required', 'Add your Supabase URL and publishable key to the local .env file.');
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) Alert.alert('Sign in failed', error.message); else onDone();
  };
  return <SafeAreaView style={styles.login}>
    <Text style={styles.logo}>🥛 DoodhWala</Text>
    <Text style={styles.subtitle}>Your daily delivery, simply managed.</Text>
    <View style={styles.card}>
      <Text style={styles.heading}>Administrator login</Text>
      <TextInput style={styles.input} placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
      <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={signIn}/>
      {!isSupabaseConfigured && <Text style={styles.hint}>Supabase connection will activate after local environment setup.</Text>}
    </View>
  </SafeAreaView>;
}

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<Tab>('Home');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [billCustomer, setBillCustomer] = useState<Customer | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState('52');
  const [previousBalance, setPreviousBalance] = useState('0');
  const [month, setMonth] = useState(today().slice(0, 7));

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setSessionReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const load = async () => {
    if (!supabase) return;
    const [c, p, d] = await Promise.all([
      supabase.from('customers').select('id,name,active').eq('active', true).order('name'),
      supabase.from('products').select('id,company,product_name,unit,company_mrp').order('company'),
      supabase.from('delivery_entries').select('customer_id,product_id,delivery_date,status,delivered_quantity,unit,customer_price').eq('delivery_date', today())
    ]);
    if (c.error || p.error || d.error) {
      Alert.alert('Could not load data', c.error?.message || p.error?.message || d.error?.message);
      return;
    }
    setCustomers(c.data || []); setProducts(p.data || []); setEntries(d.data || []);
  };
  useEffect(() => { if (signedIn) load(); }, [signedIn]);

  const filtered = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const deliveredCount = new Set(entries.filter(e => e.status === 'delivered').map(e => e.customer_id)).size;
  const milkAmount = billCustomer ? entries.filter(e => e.customer_id === billCustomer.id && e.status === 'delivered').reduce((s, e) => s + e.delivered_quantity * e.customer_price, 0) : 0;

  const toggleDelivery = async (customer: Customer, status: 'delivered' | 'not_delivered') => {
    if (!supabase) return Alert.alert('Not connected', 'Configure Supabase before saving delivery data.');
    const { error } = await supabase.from('daily_attendance').upsert({
      owner_id: (await supabase.auth.getUser()).data.user?.id,
      customer_id: customer.id, delivery_date: today(), status
    }, { onConflict: 'owner_id,customer_id,delivery_date' });
    if (error) return Alert.alert('Save failed', error.message);
    Alert.alert('Saved', customer.name + ': ' + status.replace('_', ' '));
  };

  const uploadDay = async () => {
    if (!supabase) return Alert.alert('Not connected', 'Configure Supabase before uploading.');
    setUploading(true);
    const user = await supabase.auth.getUser();
    if (!user.data.user) { setUploading(false); return Alert.alert('Login required', 'Please sign in again.'); }
    const { error } = await supabase.from('daily_attendance').select('id').eq('delivery_date', today()).limit(1);
    setUploading(false);
    if (error) return Alert.alert('Upload check failed', error.message);
    setLastUpload(new Date().toLocaleString());
    Alert.alert('Database checked', 'Attendance records are accessible. Delivery quantity upload will be enabled after product quantities are entered.');
  };

  const signOut = async () => { await supabase?.auth.signOut(); setCustomers([]); setEntries([]); };

  if (!sessionReady) return <View style={styles.center}><ActivityIndicator color={GREEN}/></View>;
  if (!signedIn) return <Login onDone={() => setSignedIn(true)}/>;

  const renderCustomer = ({ item }: { item: Customer }) => {
    const row = entries.find(e => e.customer_id === item.id);
    return <View style={styles.customerRow}>
      <View style={{ flex: 1 }}><Text style={styles.customerName}>{item.name}</Text><Text style={styles.muted}>{row?.status === 'delivered' ? 'Delivered today' : row?.status === 'not_delivered' ? 'Not delivered' : 'Not marked yet'}</Text></View>
      <TouchableOpacity style={styles.smallAction} onPress={() => toggleDelivery(item, 'delivered')}><Text style={styles.actionText}>✓</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.smallAction, styles.absent]} onPress={() => toggleDelivery(item, 'not_delivered')}><Text style={[styles.actionText, { color: '#B84C4C' }]}>—</Text></TouchableOpacity>
    </View>;
  };

  return <SafeAreaView style={styles.safe}>
    <ExpoStatusBar style="dark"/>
    <View style={styles.header}><View><Text style={styles.logoSmall}>🥛 DoodhWala</Text><Text style={styles.muted}>Morning delivery · {today()}</Text></View><TouchableOpacity onPress={signOut}><Text style={styles.signout}>Sign out</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab === 'Home' && <>
        <Text style={styles.greeting}>Good morning 👋</Text><Text style={styles.subtitle}>Here’s your delivery overview.</Text>
        <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricValue}>{customers.length}</Text><Text style={styles.muted}>Customers</Text></View><View style={styles.metric}><Text style={styles.metricValue}>{deliveredCount}</Text><Text style={styles.muted}>Delivered</Text></View></View>
        <View style={styles.card}><Text style={styles.heading}>Today's progress</Text><Text style={styles.metricValue}>{customers.length ? Math.round(deliveredCount / customers.length * 100) : 0}%</Text><View style={styles.track}><View style={[styles.fill, { width: (customers.length ? Math.min(100, deliveredCount / customers.length * 100) : 0) + '%' }]}/></View><Text style={styles.muted}>{deliveredCount} of {customers.length} customers marked delivered</Text></View>
        <Button title="Open delivery list" onPress={() => setTab('Delivery')}/><Button title={uploading ? 'Checking…' : 'Upload daily data'} onPress={uploadDay} secondary/>
        {lastUpload && <Text style={styles.hint}>Last database check: {lastUpload}</Text>}
      </>}
      {tab === 'Delivery' && <>
        <Text style={styles.heading}>Morning attendance</Text><Text style={styles.muted}>Mark each customer delivered or not delivered.</Text>
        <TextInput style={styles.input} placeholder="Search customers" value={search} onChangeText={setSearch}/>
        {filtered.map(c => <View key={c.id}>{renderCustomer({ item: c })}</View>)}
        <Button title="Upload daily data" onPress={uploadDay}/>
      </>}
      {tab === 'Customers' && <>
        <Text style={styles.heading}>Customers</Text><TextInput style={styles.input} placeholder="Search customers" value={search} onChangeText={setSearch}/>
        {filtered.map(c => <View style={styles.customerRow} key={c.id}><Text style={styles.customerName}>{c.name}</Text><Text style={styles.muted}>Active</Text></View>)}
        <Text style={styles.hint}>Customer creation and product assignments are the next implementation step.</Text>
      </>}
      {tab === 'Monthly' && <>
        <Text style={styles.heading}>Monthly delivery history</Text><TextInput style={styles.input} value={month} onChangeText={setMonth} placeholder="YYYY-MM"/>
        {customers.map(c => <TouchableOpacity key={c.id} style={styles.customerRow} onPress={() => setBillCustomer(c)}><Text style={styles.customerName}>{c.name}</Text><Text style={styles.actionText}>View ›</Text></TouchableOpacity>)}
        {billCustomer && <View style={styles.card}><Text style={styles.heading}>{billCustomer.name}</Text><Text style={styles.muted}>Monthly date-wise history will be loaded here for {month}.</Text><Button title="Close" secondary onPress={() => setBillCustomer(null)}/></View>}
      </>}
      {tab === 'Bills' && <>
        <Text style={styles.heading}>Customer bills</Text>
        {customers.map(c => <TouchableOpacity key={c.id} style={styles.customerRow} onPress={() => setBillCustomer(c)}><Text style={styles.customerName}>{c.name}</Text><Text style={styles.actionText}>Prepare bill ›</Text></TouchableOpacity>)}
        {billCustomer && <View style={styles.receipt}>
          <Text style={styles.receiptTitle}>DOODHWALA</Text><Text style={styles.receiptSub}>{billCustomer.name} · {month}</Text>
          <View style={styles.rule}/><Text style={styles.receiptLine}>Milk amount              ₹{milkAmount.toFixed(2)}</Text>
          <Text style={styles.receiptLine}>Delivery charge          ₹{Number(deliveryCharge || 0).toFixed(2)}</Text>
          <Text style={styles.receiptLine}>Previous balance        ₹{Number(previousBalance || 0).toFixed(2)}</Text>
          <View style={styles.rule}/><Text style={styles.total}>Total payable  ₹{(milkAmount + Number(deliveryCharge || 0) + Number(previousBalance || 0)).toFixed(2)}</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={deliveryCharge} onChangeText={setDeliveryCharge} placeholder="Delivery charge"/>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={previousBalance} onChangeText={setPreviousBalance} placeholder="Previous balance"/>
        </View>}
      </>}
    </ScrollView>
    <View style={styles.nav}>{(['Home','Delivery','Customers','Monthly','Bills'] as Tab[]).map(t => <TouchableOpacity key={t} onPress={() => { setTab(t); setBillCustomer(null); }} style={styles.navItem}><Text style={[styles.navText, tab === t && styles.navActive]}>{t}</Text></TouchableOpacity>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG }, login: { flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  content: { padding: 18, paddingBottom: 100 }, logo: { fontSize: 30, fontWeight: '800', color: GREEN, textAlign: 'center' }, logoSmall: { fontSize: 21, fontWeight: '800', color: GREEN }, signout: { color: GREEN, fontWeight: '700' },
  greeting: { fontSize: 27, fontWeight: '800', color: INK, marginTop: 8 }, subtitle: { color: MUTED, marginTop: 5, marginBottom: 18 }, heading: { fontSize: 19, fontWeight: '800', color: INK, marginBottom: 12 }, muted: { color: MUTED, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginVertical: 10, shadowColor: '#173D2D', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 12 }, metric: { flex: 1, backgroundColor: '#E8F3EC', borderRadius: 16, padding: 18 }, metricValue: { color: GREEN, fontSize: 27, fontWeight: '800', marginBottom: 4 },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E6EDE8', overflow: 'hidden', marginVertical: 12 }, fill: { height: 8, backgroundColor: GREEN, borderRadius: 8 },
  button: { backgroundColor: GREEN, borderRadius: 13, padding: 15, alignItems: 'center', marginVertical: 6 }, buttonSecondary: { backgroundColor: '#E5F1E9' }, buttonText: { color: '#FFFFFF', fontWeight: '800' }, buttonTextSecondary: { color: GREEN },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2EAE4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginVertical: 7, color: INK },
  customerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 13, padding: 13, marginVertical: 5, gap: 9 }, customerName: { color: INK, fontWeight: '700', flex: 1 },
  smallAction: { backgroundColor: '#E4F4EA', width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, absent: { backgroundColor: '#FCEEEE' }, actionText: { color: GREEN, fontWeight: '800' },
  nav: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E6EDE8', justifyContent: 'space-around' }, navItem: { padding: 5 }, navText: { color: MUTED, fontSize: 11, fontWeight: '600' }, navActive: { color: GREEN, fontWeight: '900' },
  receipt: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#E5E9E6' }, receiptTitle: { textAlign: 'center', color: INK, fontSize: 15, fontWeight: '900' }, receiptSub: { textAlign: 'center', color: MUTED, fontSize: 11, marginVertical: 4 }, rule: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#CBD6CE', marginVertical: 8 }, receiptLine: { color: INK, fontSize: 12, marginVertical: 3 }, total: { color: GREEN, fontSize: 14, fontWeight: '900', marginVertical: 5 }, hint: { color: MUTED, fontSize: 11, lineHeight: 16, marginTop: 8 }
});