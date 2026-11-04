import React, { useMemo, useState } from 'react';
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Alert
} from 'react-native';

type Page = 'Home' | 'Delivery' | 'Customers' | 'Monthly' | 'Bills' | 'Companies';
type Customer = { name: string; product: string; quantity: number; rate: number | null };
const GREEN = '#16845B';
const INK = '#18332A';
const MUTED = '#718078';
const BG = '#F4F8F5';

const customers: Customer[] = [
  {name:'Aarav',product:'Heritage TM',quantity:1,rate:66},
  {name:'Ananya',product:'Vijaya TM',quantity:1,rate:69},
  {name:'Kiran',product:'Amul TM',quantity:1,rate:60},
  {name:'Meera',product:'Heritage CM',quantity:1,rate:66},
  {name:'Ravi',product:'Jersey TM',quantity:1,rate:66},
  {name:'Sana',product:'Heritage TM + Small Milk',quantity:1,rate:66},
  {name:'Vikram',product:'Vijaya SM',quantity:1,rate:70},
  {name:'Diya',product:'Amul Gold',quantity:1,rate:74},
  {name:'Farhan',product:'Heritage WM',quantity:1,rate:90},
  {name:'Isha',product:'Jersey WM',quantity:1,rate:90},
  {name:'Nikhil',product:'Vijaya WM',quantity:1,rate:80},
  {name:'Opposite Oxygen Park',product:'Vijaya TM',quantity:1,rate:null}
];
const rates = [
  ['Heritage','TM','₹66/L','₹66/L'],['Heritage','CM','₹66/L','₹66/L'],
  ['Heritage','SM','₹68/L','₹68/L'],['Heritage','WM','₹90/L','₹90/L'],
  ['Heritage','Small Milk','₹8/packet','₹8/packet'],['Heritage','Small Curd','₹8/packet','₹8/packet'],
  ['Vijaya','TM','₹64/L','₹69/L'],['Vijaya','CM','₹64/L','₹69/L'],
  ['Vijaya','SM','₹70/L','₹70/L'],['Vijaya','WM','₹80/L','₹80/L'],
  ['Amul','TM','₹60/L','₹60/L'],['Amul','A2','₹84/L','₹84/L'],
  ['Amul','Gold','₹74/L','₹74/L'],['Jersey','TM','₹66/L','₹66/L'],
  ['Jersey','WM','₹90/L','₹90/L']
];
const money = (n:number) => '₹' + n.toFixed(2);
const dateLabel = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

function Action({label,onPress,secondary=false}:{label:string;onPress:()=>void;secondary?:boolean}) {
  return <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.button,secondary && s.buttonSecondary]}><Text style={[s.buttonText,secondary && s.buttonTextSecondary]}>{label}</Text></TouchableOpacity>;
}
function Panel({children}:{children:React.ReactNode}) { return <View style={s.panel}>{children}</View>; }
function Heading({children}:{children:React.ReactNode}) { return <Text style={s.heading}>{children}</Text>; }

export default function App() {
  const [page,setPage] = useState<Page>('Home');
  const [delivered,setDelivered] = useState<number[]>([]);
  const [absent,setAbsent] = useState<number[]>([]);
  const [search,setSearch] = useState('');
  const [month,setMonth] = useState(new Date().toISOString().slice(0,7));
  const [selected,setSelected] = useState(0);
  const [charge,setCharge] = useState('52');
  const [balance,setBalance] = useState('0');
  const filtered = useMemo(()=>customers.map((c,i)=>({c,i})).filter(x=>x.c.name.toLowerCase().includes(search.toLowerCase())),[search]);
  const mark = (i:number,yes:boolean) => {
    setDelivered(old=>yes?[...old.filter(x=>x!==i),i]:old.filter(x=>x!==i));
    setAbsent(old=>yes?old.filter(x=>x!==i):[...old.filter(x=>x!==i),i]);
  };
  const reset = () => {setDelivered([]);setAbsent([]);};
  const go = (p:Page) => {setPage(p);setSearch('');};
  const c = customers[selected];
  const rate = c.rate ?? 69;
  const milk = c.quantity * rate * 26;
  const total = milk + (Number(charge)||0) + (Number(balance)||0);
  const tabs:Page[] = ['Home','Delivery','Customers','Monthly','Bills','Companies'];

  const customerRows = (mode:'delivery'|'customer'|'monthly') => filtered.map(({c:customer,i})=>
    <View key={customer.name} style={s.row}>
      <View style={{flex:1}}>
        <Text style={s.customerName}>{customer.name}</Text>
        <Text style={s.muted}>{customer.product} · {customer.quantity} unit</Text>
      </View>
      {mode==='delivery' ? <>
        <Text style={[s.pill,absent.includes(i)&&s.pillRed]}>{delivered.includes(i)?'Delivered':absent.includes(i)?'Not delivered':'Not marked'}</Text>
        <TouchableOpacity style={s.tick} onPress={()=>mark(i,true)}><Text style={s.action}>✓</Text></TouchableOpacity>
        <TouchableOpacity style={s.cross} onPress={()=>mark(i,false)}><Text style={{color:'#A33',fontWeight:'800'}}>—</Text></TouchableOpacity>
      </> : mode==='monthly' ?
        <TouchableOpacity style={s.miniButton} onPress={()=>setSelected(i)}><Text style={s.action}>View month →</Text></TouchableOpacity> :
        <Text style={s.pill}>Active</Text>}
    </View>
  );

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
    <View style={s.header}>
      <View><Text style={s.brand}>🥛 DoodhWala</Text><Text style={s.muted}>Morning delivery management</Text></View>
      <Text style={s.muted}>{dateLabel}</Text>
    </View>
    <View style={s.navWrap}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nav}>
      {tabs.map(t=><TouchableOpacity key={t} onPress={()=>go(t)} style={[s.navItem,page===t&&s.navSelected]}><Text style={[s.navText,page===t&&s.navTextActive]}>{t}</Text></TouchableOpacity>)}
    </ScrollView></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {page==='Home' && <>
        <View style={s.pageHead}><View><Text style={s.title}>Good morning 👋</Text><Text style={s.muted}>Here’s your delivery overview.</Text></View><Text style={s.tag}>MORNING ROUTE</Text></View>
        <View style={s.metrics}>
          <View style={s.stat}><Text style={s.muted}>Customers</Text><Text style={s.statValue}>{customers.length}</Text></View>
          <View style={s.stat}><Text style={s.muted}>Delivered</Text><Text style={s.statValue}>{delivered.length}</Text></View>
          <View style={s.stat}><Text style={s.muted}>Not delivered</Text><Text style={s.statValue}>{absent.length}</Text></View>
        </View>
        <Panel><Heading>Today's progress</Heading><Text style={s.statValue}>{Math.round(delivered.length/customers.length*100)}%</Text><View style={s.track}><View style={[s.fill,{width:(delivered.length/customers.length*100)+'%'}]}/></View><Text style={s.muted}>{delivered.length} of {customers.length} customers marked delivered</Text></Panel>
        <Action label="Open delivery list →" onPress={()=>go('Delivery')}/>
        <Text style={s.notice}>Interactive mobile prototype. Demo changes stay on this device session and are not yet saved to Supabase.</Text>
      </>}
      {page==='Delivery' && <>
        <View style={s.pageHead}><View><Text style={s.title}>Morning delivery</Text><Text style={s.muted}>Mark each customer delivered or not delivered.</Text></View><Text style={s.tag}>MORNING ONLY</Text></View>
        <Panel><View style={s.toolbar}><TextInput value={search} onChangeText={setSearch} placeholder="Search customers…" style={[s.input,{flex:1}]}/><TouchableOpacity onPress={reset} style={s.miniButton}><Text style={s.action}>Reset</Text></TouchableOpacity></View>{customerRows('delivery')}</Panel>
      </>}
      {page==='Customers' && <>
        <Heading>Customers</Heading><Panel><TextInput value={search} onChangeText={setSearch} placeholder="Search customers…" style={s.input}/>{customerRows('customer')}</Panel>
      </>}
      {page==='Monthly' && <>
        <View style={s.pageHead}><View><Text style={s.title}>Monthly history</Text><Text style={s.muted}>Choose a customer to inspect sample date-wise records.</Text></View></View>
        <TextInput value={month} onChangeText={setMonth} placeholder="YYYY-MM" style={s.input}/>
        <Panel><TextInput value={search} onChangeText={setSearch} placeholder="Search customers…" style={s.input}/>{customerRows('monthly')}
          <View style={s.rule}/><Heading>{c.name} · {month}</Heading>
          {Array.from({length:7},(_,n)=><View key={n} style={s.historyRow}><Text style={s.muted}>{String(n+1).padStart(2,'0')} {month}</Text><Text style={s.customerName}>{n===2?'Not delivered':'Delivered'}</Text><Text style={s.muted}>{n===2?'—':c.quantity+' unit'}</Text></View>)}
          <Text style={s.notice}>Illustrative history only; actual delivery records will come from the database.</Text>
        </Panel>
      </>}
      {page==='Bills' && <>
        <Heading>Customer bills</Heading><Panel>
          <Text style={s.label}>Select customer</Text>
          <View style={s.customerPicker}>{customers.map((x,i)=><TouchableOpacity key={x.name} onPress={()=>setSelected(i)} style={[s.pickerItem,selected===i&&s.pickerActive]}><Text style={[s.pickerText,selected===i&&s.pickerTextActive]}>{x.name}</Text></TouchableOpacity>)}</View>
          <View style={s.receipt}>
            <Text style={s.receiptTitle}>DOODHWALA</Text><Text style={s.receiptSub}>{c.name} · {month}</Text>
            <View style={s.receiptLine}><Text style={s.receiptText}>Total days</Text><Text style={s.receiptText}>30</Text></View>
            <View style={s.receiptLine}><Text style={s.receiptText}>Delivered days</Text><Text style={s.receiptText}>26</Text></View>
            <View style={s.receiptLine}><Text style={s.receiptText}>Not delivered</Text><Text style={s.receiptText}>4</Text></View>
            <View style={s.rule}/><View style={s.receiptLine}><Text style={s.receiptText}>Milk amount</Text><Text style={s.receiptText}>{money(milk)}</Text></View>
            <View style={s.receiptLine}><Text style={s.receiptText}>Delivery charge</Text><Text style={s.receiptText}>{money(Number(charge)||0)}</Text></View>
            <View style={s.receiptLine}><Text style={s.receiptText}>Previous balance</Text><Text style={s.receiptText}>{money(Number(balance)||0)}</Text></View>
            <View style={s.rule}/><View style={s.receiptLine}><Text style={s.total}>Total payable</Text><Text style={s.total}>{money(total)}</Text></View>
          </View>
          <Text style={s.label}>Delivery charge (editable)</Text><TextInput keyboardType="decimal-pad" value={charge} onChangeText={setCharge} style={s.input}/>
          <Text style={s.label}>Previous balance</Text><TextInput keyboardType="decimal-pad" value={balance} onChangeText={setBalance} style={s.input}/>
          <Text style={s.notice}>Demo bill values: 26 delivered days and 4 not delivered days. Actual monthly billing needs saved delivery quantities.</Text>
        </Panel>
      </>}
      {page==='Companies' && <>
        <Heading>Company rates & settlement</Heading><Panel><Text style={s.label}>Company product rates</Text>
          {rates.map((r,i)=><View key={i} style={s.rateRow}><View style={{flex:1}}><Text style={s.customerName}>{r[0]} · {r[1]}</Text><Text style={s.muted}>Company MRP {r[2]}</Text></View><Text style={s.rateValue}>{r[3]}</Text></View>)}
          <Text style={s.notice}>Company MRP and customer selling price are kept separate. Commission rule: ₹5 per net litre. Packet sizes are not assumed.</Text>
        </Panel>
      </>}
      <Text style={s.footer}>DoodhWala · Morning delivery</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:BG},header:{backgroundColor:'#FFFFFF',paddingHorizontal:18,paddingVertical:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:'#E7EEE9'},
  brand:{fontSize:21,fontWeight:'900',color:GREEN},muted:{fontSize:12,color:MUTED,marginTop:3},navWrap:{backgroundColor:'#FFFFFF',borderBottomWidth:1,borderColor:'#E7EEE9'},nav:{paddingHorizontal:10,paddingVertical:8,gap:6},navItem:{paddingVertical:10,paddingHorizontal:13,borderRadius:10},navSelected:{backgroundColor:'#E5F1E9'},navText:{fontSize:12,fontWeight:'700',color:MUTED},navTextActive:{color:GREEN},
  content:{padding:16,paddingBottom:40},pageHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:15},title:{fontSize:24,fontWeight:'900',color:INK},tag:{fontSize:9,fontWeight:'900',color:'#795D16',backgroundColor:'#FFF4D8',padding:7,borderRadius:7,overflow:'hidden'},
  metrics:{flexDirection:'row',gap:8,marginBottom:14},stat:{flex:1,backgroundColor:'#FFFFFF',borderRadius:14,padding:12,borderWidth:1,borderColor:'#E5ECE7'},statValue:{fontSize:25,fontWeight:'900',color:GREEN,marginTop:6},
  panel:{backgroundColor:'#FFFFFF',borderRadius:16,borderWidth:1,borderColor:'#E5ECE7',padding:15,marginBottom:14},heading:{fontSize:17,fontWeight:'850',color:INK,marginBottom:12},track:{height:9,backgroundColor:'#E6EDE8',borderRadius:20,overflow:'hidden',marginVertical:12},fill:{height:9,backgroundColor:GREEN,borderRadius:20},
  button:{backgroundColor:GREEN,borderRadius:11,padding:14,alignItems:'center',marginVertical:6},buttonSecondary:{backgroundColor:'#E5F1E9'},buttonText:{color:'#FFFFFF',fontWeight:'800'},buttonTextSecondary:{color:GREEN},
  notice:{fontSize:11,lineHeight:17,color:MUTED,marginVertical:9},toolbar:{flexDirection:'row',gap:8,alignItems:'center',marginBottom:8},input:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DCE6DF',borderRadius:10,paddingHorizontal:12,paddingVertical:10,color:INK,marginVertical:5},
  row:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:12,borderBottomWidth:1,borderColor:'#EDF1EE'},customerName:{fontSize:13,fontWeight:'700',color:INK,flexShrink:1},pill:{fontSize:10,color:GREEN,backgroundColor:'#E5F1E9',paddingHorizontal:8,paddingVertical:5,borderRadius:20,overflow:'hidden'},pillRed:{color:'#A33',backgroundColor:'#FCEEEE'},tick:{width:30,height:30,alignItems:'center',justifyContent:'center',backgroundColor:'#E4F4EA',borderRadius:8},cross:{width:30,height:30,alignItems:'center',justifyContent:'center',backgroundColor:'#FCEEEE',borderRadius:8},action:{fontSize:11,fontWeight:'800',color:GREEN},miniButton:{backgroundColor:'#E5F1E9',padding:8,borderRadius:8},rule:{borderTopWidth:1,borderStyle:'dashed',borderColor:'#CBD6CE',marginVertical:10},
  historyRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:9,borderBottomWidth:1,borderColor:'#EDF1EE'},customerPicker:{maxHeight:120,flexDirection:'row',flexWrap:'wrap',gap:6,marginVertical:8},pickerItem:{paddingHorizontal:9,paddingVertical:7,backgroundColor:'#F0F4F1',borderRadius:8},pickerActive:{backgroundColor:GREEN},pickerText:{fontSize:10,color:INK},pickerTextActive:{color:'#FFFFFF'},label:{fontSize:11,fontWeight:'700',color:MUTED,marginTop:9},receipt:{borderWidth:1,borderStyle:'dashed',borderColor:'#AAB8AF',padding:13,marginVertical:12,borderRadius:8},receiptTitle:{fontSize:15,fontWeight:'900',color:INK,textAlign:'center'},receiptSub:{fontSize:10,color:MUTED,textAlign:'center',marginVertical:5},receiptLine:{flexDirection:'row',justifyContent:'space-between',marginVertical:5},receiptText:{fontSize:11,color:INK},total:{fontSize:13,fontWeight:'900',color:GREEN},rateRow:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderColor:'#EDF1EE'},rateValue:{fontSize:12,fontWeight:'800',color:GREEN},footer:{textAlign:'center',fontSize:10,color:MUTED,marginVertical:10}
});
