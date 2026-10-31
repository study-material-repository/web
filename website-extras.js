const portraitPalette = [
  'transparent',
  '#1967d2',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#a142f4',
  '#ffffff',
  '#202124',
  '#ffccaa',
  '#ab5236',
  '#ffa300',
  '#ff77a8',
  '#29adff',
  '#1d2b53',
  '#7e2553',
  '#008751',
  '#5f574f',
  '#c2c3c7',
  '#fff1e8',
  '#ff004d',
  '#00e436',
  '#83769c',
  '#ffec27',
  '#003049',
  '#493c2b',
  '#8c5a3c',
  '#d99873',
  '#e8b896',
  '#584563',
  '#b8d9ff',
  '#cdb280',
  '#705139',
];
const portraitPresets = [
  '00000000000000000000000000400040l4g440440444444400444444000g4444',
  '00000000000000000000000000hhhhh000hhhhh00hhhhhhhhhhhhhhq00002222',
  '00000000000000000000000000lhhhh0lhlhhhhhhllhhhhhhlhhhhhh000hhhhh',
  '00000000000000000000000000o0lhl00llhilhglllgglhg000ollls000o00o0',
  '000000000000000000000000440ooo00444g4gg00444444000ggggg400440440',
  '000000000000000000000000aaapvpv0a3a99q93003a33330033033300300030',
  '000000000000000000000000pm33m3m0qmm3m33m00mm3m3m00mm00mm00m000m0',
  '0000000000000000000000110111100111111111c1111111ccc1111000ccccc0',
  '00000000000000000000ll000lullll00llllllllslllllllllllll202222222',
  '00000000000000000011100001cccc11cdc1ccc11cc1ccc011cccc110cccc001',
  '0000000000000000008888000rr888808888888888888888008888800088r880',
  '0000000000000000hhq999909999999999999999099999990099999000090090',
  '0000000000000000iiiiiii0iirmiiiilluu8iiihhuu8iii0hhiiiih007lhll0',
  '00000000000000u0ll0000u0glpp0lu0llpplll00lluuuuu0l0lluuh00000000',
  '000000000007700000oooo0000pqqp0077ooo7000o77770007soos70077ss770',
  '00000000000bb0000bqqqqb0rbqqqqbrrbbbbbbr8rbbbbr800888r0000000000',
  '00000000000gg000ll0gg0llllllllllllllllllllllllll000ll00000000000',
  '0000000000900000099999000999999909q999998rq9999999v9999990v90o90',
  '000000000099090099999900999999qqqqqqqqqqqqqqqq000qqqq00000000000',
  '0000000000hh00000shlood0ogsoooooodoooooo00oooooo000ooooo000o00o0',
  '0000000000hlhu000huluuh0uuhlsluuhhulluhhluulluulhhh11hhh000dd000',
  '0000000000mmm0000mqmm000amqmmm000mmmmmmm00mmm3mm000mmmm000033300',
  '0000000000ooo000ogvoop90p9ooo999q9ooo999q9ooo99900ovv09000090090',
  '0000000000pppp000pppppp0op9999poopqqqqpoooqhhqoo0opllpo000qqqq00',
  '0000000000rrrr00rrqrrqrrrporroprrporroprrrqrrqrr00rrrr0000000000',
  '0000000009900000p99999900p9999990999999p000099po00oovvvo00ooooo0',
  '000000000h0000000sshhoo0ooohlooooolhlooo00hsllll000hhhl0000h00h0',
  '000000000hhhhhh0llhhhhllllhhhhll0llggll00hhoohh000hllh0000000000',
  '000000000l000000hl003300hhq3mm300h3m33m3hhqmmmm3hhhu3m330hhhuquh',
  '000000000l0llll000lllll00llllll00llllll00lllll000llll0l000000000',
  '000000000mmmm000ii8imii0hh8r8iiiiiiiiiii0iiiiiii00iiiiii000iiii0',
  '000000000p099990999999900999999900999999009999900099009000090090',
  '0000000040000c0c4uuuu0c0uu4uuu0cuu4uuuh00uu4uuu00uuuu4uu000uuuu0',
  '0000000099909900099999900999999909999999009999900009009000090090',
  '000000009po000079999999o00999999009999900p900p900o9ov99000000v00',
  '00000000hhtctc00hhhtcchhlhhhhhhh0ulllhll088ruu008888880088888800',
  '00000000qqrrrh00qr8i88h0qrr8rrrh0urr88rh0pirrr8q00uhhhl000000000',
  '00000000s0ssss0sssssssssssssssss0ssssss00ssssss000ssss000s0000s0',
  '000000770go00007oo700007so77777700777770007oso700077077000770770',
  '000000mm03m0000mqqm0000mrrmm3mmm00mmmmm000mm8mm0003m0am000am0am0',
  '000009000000qqq00q00qqqqqqqqqqqqqqqqq9qqqqq0qqqqqqq0qqqq00000qqq',
  '00000ccc0000c1dc0eeccc1ceellecc000lelc000qelle003mq0ee003300e000',
  '00000llg0000lh770000llg000000gh00lsollll7777ghho0077777700077770',
  '00000ovv000q9voo00qq99900qqqqq000qqqq0000qqq000099q0000000000000',
  '00004vo000qquv00qqqqppqqqqpppqqqqqqqqqqq0qqqqqpv0vpppp44ovv00400',
  '00004vo000qquv00uqulhlqqqqlcclqqqqquqqqq0qqqqqpv0vpppp44vvv00400',
  '0000cccc00ccccc00c11cccc0c11ccccccccctcc0000cccc000cccc0000cc000',
  '0000l000000lll000lsglll0llllllllggllllll00000lslllllllssll000000',
  '0000llhl0000llrlh00hhhhlhhhhhhhhhhhglhhhhhhlhhhhhllhhhhh0hhhhh00',
  '0000mu00000mu000004uum40444umu00044uu400004400000044000000400000',
  '0000oo000g4go4400444444044uuuuh009puhu90099999900099990000999900',
  '0000ooo0000444440044g44444uu4444444444440040444400004440000044g0',
  '0000ooo00oogg400044gp440044qq0440400q000040qq000000qq0000009q000',
  '0000q220000029q00222q2q00q92qq20220qqq202200q0qq02q0q2qq00q02q20',
  '00022000000rr00000iiii0000hiih0000uqqu00008aa8000iirrii000iqqi00',
  '0002200000222200002222002222222222222222022222200022220000000000',
  '0002200000qqqq0002quuq2022uuuu2222qqqu222229922222qqqq22uuuuuuuu',
  '000220000292200232922222022222920022292200022220000022a000003000',
  '00022000tc022000q0222200qqqqqq20q2rqqr20q0rqqr00mq2mm220qq2qq220',
  '0002q000008bb800088bb8000r8bb88000rrr8004440u4440444444000044000',
  '0002q000t0020r0000022200002200q2q22qqq20022022rt0022220000022000',
  '000330000033330003mmmm30thmqqmhtttrmmrtttttuuttt0r2qq2r00m2222m0',
  '0003330000mm33000mm3333m0qq333mmmmmmmmmmmmmmmmmm0mmmmm0000033300',
  '0004400000044000004gg400004gg40004g44g400ggoogg0044vv440000oo000',
  '0004400000444444044444444444444444444444444444400444440000044000',
  '0004444000244444000000440440004444044044444444444444444444400444',
  '0007vvv0000700vv000700vv000000vovv0vvvvvpppvppp0999pp99009000000',
  '0008800000r8br0088bbrr888br88b888rbrrbr808br8r80088brb8000800800',
  '00099000099999900qqqqqq0qqpllpqqqqqqqqqq0qqqqqq009qooq9000qqqq00',
  '000bb00002b88b2002r88r2002b88b2000buub0002qllq200qr88rq088800888',
  '000gp30000olqp0007h66h7007i66i707o6666o777i66i770ol66lo003qrrq30',
  '000ii0000m8hii00mmr8ii0000iiiii000iiiii00hhlhlh00o77ooo077777777',
  '000mm00000mmmm000m9mm9m00mm33mm00mmmmmm0mmmmmmmm00mmmm0000033000',
  '000mm00000mmmm000m9mm9m00um33mu0hummmmuhi8rrrm8i0iiii8i000iiii00',
  '000oo00000dood00de999eeo02ee9v20o9e9e99o09e999e0o9eeeo9o00299900',
  '000vpo00022pmp00022qmp00vp992v00vmmq2po0oppvp4400000o44400000044',
  '0022q20008b2b2b0b882q2rb2bq28b222222q22200hhhh0000hhhh0000hhhh00',
  '0033330003399330039oo930039oo93003a99a3000333300ooovvooo0oooooo0',
  '0044400000404qq00040222000u022q00uuh22200uuh022000uu000000040000',
  '004440000444404444u4404004444044044400440o4400440044444400444440',
  '0044440000444400044444404444444444444444444044440000400000004400',
  '004444000444444044444444444444444444444404444440004vv400000oo000',
  '009000000q990000qqq990900qq99p99o99q99p9099qq9p9000qq99900099990',
  '00900000lqp000qqrr99000q00rqqqqq00rqqqq000qurqq0009q00qq009q009q',
  '0099ee0000999e0009999ee009999ee000v99v0000oooo00000oo00000000000',
  '0099o77000op9po700q9999v0qqp99990q999999qq9999999999099999900099',
  '00b22b000r8bb8r02bb88bb22b6666b2bbr66rbbbb8ii8bb02qbbq20002bb200',
  '00c000000cc000010c00001111110001111111111s11111c111111c0ccccccc0',
  '00d00d00000oo00000lggl00hhhhhhhhhhlgglhh00qqqq0000oooo00000qq000',
  '00h00000hhhhlhh0hlhhlhhhhlhhlhhhhllllhhhhhhhhhhhhhhhhhh00hhh0hh0',
  '00hh00000qhh00000hhhh0h00hhhhhh000hlhhh0000lhl00000aq000000a3000',
  '00hh00h0000hh0hh000hh0hh0hhhhhhh0uhhhhh004uluh00000lhhhh000440h0',
  '00hhhh000hhhhhh0hl7ll7lhhg7ll7ghhhhhhhhh0hhllhh00hhhhhh000hhhh00',
  '00iihh000htihii00hhaaii00iiaahh00ithith000hhhi000044440000044000',
  '00iiii0000iihh000ilhlgii0iiihhiiiiigohiiiiig7li0i0iihtii00iiiiii',
  '00llll000llllll00llllll00llllll00llllll0lllllllllllllllllll00lll',
  '00lqql000cccccc0qthtthtqqtqttqtquctcctcu0tttttt01cccccc111111111',
  '00mr880088rqb80088b2br8808r22qb888bbb888r888bru44uur8r400444u400',
  '00o000000voo0000mmvo000000g0qqq00rrqqrug09qhiiil00hiiii000000000',
  '00o00o00000oo0000oooooo000vvvv000ovoovo00ovoovo00o9oo9o00o0990o0',
  '00oooo000dooood00dooood0sossssosossllsso0slssls00ssssss00osssso0',
  '00q00000gqp000o0qqpvop0000lq4qq000pqpqqq00quqqqq009q00qq009q009q',
  '00q00000pqp000e0qqpv0e0000pq900000p9q90000qqpq0000qqqqqq00qqqqqq',
  '00thg77000slhgo700lhhllg0llhlllg0llllllhohllllghssll0lhg777000lh',
  '00u0004000u40uuu00u4p0u0u40p44000up444000pp440000p4440000p000000',
  '0200092002290220022ee220002222000092220000999900009ee90000099000',
  '022000002hh00000aiii00ii2iiiiiii0iiiiiii0iiiiii000iiii0000033300',
  '02200000hq222220s02222220022qbq200228rb00000br0000008000000rr000',
  '02a33a200aaaaaa03aa33aa33a3883a3aaarraaa2aaaaaa2033aa33000322300',
  '0440044044444444044444400044440044444444444444440440444000004400',
  '04440000344400003q4440000044440000l4444000ql4440000qll440000l000',
  '04440000440000004400000044000000444444000444440004444440o4004444',
  '0444000044440000p4440000004444000044440000g444000004444400og4044',
  '044o0000444440000ooog44o00000o4000000o44000000g404444g4004000400',
  '0990099009e00e909e0ee0e9ee2992eee229922eee2222ee0ee22ee000e00e00',
  '099oo9900qqqqqq00pqqqqp00o9999o00o9999o00o9999o000999900003pp300',
  '099q0999qqqq0999qqqq9999qq99990900099999000999990099999900999990',
  '0ao77oa00v9299v07o2222o77sv99vs779q229977e9229e77ollllo707922970',
  '0hh00hh0h8rhhr8hhrhhhhrhhhhhhhhh0hllllh000llll00lllhhlll0l0000l0',
  '0hhh0000hhhhhhh00hhhhhh00hhhhhl00hhhhhlh00hhhllh00hhhll0000hhhh0',
  '0hi00000ahi000000ii000000i00i000iiiiiii0iiiiiiitiiiiiit00iiiti00',
  '0hl000000hh000000hhh00000lhhhh000llhhhh00ssllllh0000000o00000077',
  '0l0hl0l00shllhs00hhhhhh0hlossolhloossoolssllllssslhllhlg000hh000',
  '0ll00000lglu0000lluuh0000uuuul0000hulll0000lllll0000lll000000l0l',
  '0ll00000llll00h0lhll00hh0hllhhh00hhhhhh000lhlhh000lh0lh000lh0ll0',
  '0mm000000hh00000hhhhhhhhthhhhhhh00hhhhhh00hhhhh0000h00h0000h00h0',
  '0o0000o0000ss00000hlll00thhllhht0oolloo000ollo00000ll0000o0000o0',
  '0o0000o000ooooo00osoosd00hhgghl00ihllhi00ilosli00goooog00o0od0o0',
  '0o0000o00d0000d00oooooo00odoodo000oooo000oooooo000oooo000o0000o0',
  '0o0o0000ooooo0000ooo00000ooo00000000ooo0000ooooo0000ooo00000ooo0',
  '0o0oo0o00o4444o00g4444g004444440o444444o04444440044444g000444400',
  '0od00000ddoo0000doodoo000doooo0000ooooo000oooood0000oooo00000ooo',
  '0oooooo0o999999ooummmmuoo9qqqq9ooouqquoo0o8uu8o00oqrrqo000ovvo00',
  '0ooqqoo0oo9qq9ooovqqqqvoopgppgpo0qurruq00u8ll8u000rrrr0000022000',
  '0q000000qqq0000000q0000000qqqqq000qqqqq000qqqqq000qq00q0000000q0',
  '0qq000000qq00000qqq000000qqq00000qqqq0000qqqqq00000qqq00000q0qqq',
  '0qq00000mm30000000ap000000m9000000mm3aa000ammmp000am3390009q9aq0',
  '0qq00qq0q2qmmq2qqqmmmmqqqqmmmmqq8rvqqvr888urru88qqqrrqqq0q8888q0',
  '0u4004u0uhu44uhu4uu44uu44444444444444444uuuhhuuuhhhhhhhh00hhhh00',
  '1l8888l11h8888h188o88vr888rrrr888b8q98b88rqrrqr808r22r8000888800',
  '2000000002qhlls000uhhhls00hhhhhl00hhhhhl0hhhhhhh0hh00hhh00000hhh',
  '22220020222222202222222009222222000000220000002200000099000000e9',
  '22e22o0022loeg002q6ppi0022r99q22299999222eprrp0002q22r0002222000',
  '3m0000m3a3mmmm3a3mmmmmm3mmmmmmmmmmpmmpmmrrmqqmrr8ruqqur800mmmm00',
  '4440000004440000000404440004444000044000000440000004400000044000',
  '44gg400044444g404444u4g0044uuu440044444400444444000g44400004g440',
  '80hhhh088hhhhhh8hhlhhlhhhhhhhhhhhrrrrrrhrrqrrqrrrrrrrrrr0rrrrrr0',
  '99099099v999999v99999999q9v99v9qqqooooqq9hvvvvh99poooop909999990',
  'a000000a29a00a9229aaaa92aa9aa9aaaa9aa9aaqrraarrq00qppq00000aa000',
  'hh0000hh0hh00hh00hh00hh00hhhhhh000hhhh000hlhhlh00hhiihh00hhtthh0',
  'hhh00000hhh000000hh00000hlhhhh00hlhhhhh0hhhhhhhh00hhhhhh00hhhhh0',
  'l000000llhl00lhllhllllhl0llllll0llhllhlllhhllhhl00llll00000ll000',
  'lll00000llll00000llll00000lll00000lll000000lllll0000llll0000lll0',
  'lp0ppooolvolp000lp0lpll0lp0lglullllllglllllllglollllll000llll000',
  'o0o00o0oooooooooovoooovoprq99qrp0q9999q00099990000999900000pp000',
  'oghiihgoohiiiiholihhhhilihoggohiihsllshiiiilliii0i6hh6i0006hh600',
  'q99000l0q990dosl09voooos0oooooos0oooooos0oooooss00oooo0000333000',
  'qq9999qqqq9999qq9999999999p99p9999p99p999qqggqq90qqqqqq000q99q00',
  'qrqppqrqrrm99mrrqqqppqqqpqqqqqqpvqqqqqqvlhiuuihl7l6hh6l7006qq600',
  'rr08808rbb8888bbb888888b8l8rr8l88rq22qr88r9999r8r8b22b8r00rbbr00',
  's000000s11d77d1111cddc11sccllccs0dssssd001c11c1001cssc100ds00ss0',
  '0033330003333330333333003333000033330000333333000333333000333300',
  '000eeel0000jjjbe00v8qeu700p88r9800oruu9u0oequhu0lplhccgl00p000s0',
  '000fffgo0004kk4400opp8rg00vr90pv00o8q7qq074u8qqqou4cccll00g70070',
  '00oloee00hhi2jjh0q2r8ii20jj8888j0bqrr8uq0llru8qg0uhc6igp00ov0ee0',
  '000v0v00000l92000umhmmm0um880r73qmhrsrp9pml8bbr0qq2iiqu00jjjjjj0',
  '00ef7f000egg4k4400hhkkkk0eiikkkk0erih44fnoelihl07gkfhhff009j0ee0',
  '0eegllg0ejriligloeii060h0jiiii6h0jriiiilejjq8ru0jejj222o77dd0ddn',
  '00000000000vv00000p99p000p9090o0o9q7e7el99re9e9uo7eaao770099es00',
  '0000p0v00009pup0000mmmmm0k6mammmfh8mqmmuf83hhqpvn4uqihpo00kk0ff0',
  'l0g0p0p0ihl9pup0iilmmmmr0jimammmeb8rqmmuj8qhhupo79h3ihp700jj0ee0',
  '000ole0000hjbje00o2jiihh0ejiieeh04jhheslffeele70n407d700kk4f4f00',
  '00pppl9000mmm8mu0r98oqqo08800bb00u8ggbbg0uqirrhlhobbbbsl00l000d0',
  '00077l0000oeelo008980r70008007b007hgglq0oepqi8osidvdgg770a000p00',
  '00lee0700nigeuugif9urr8uf3988bq04av88broha0mhqq97aaut99o0am009a0',
  '0000000000lqll000bbibiq0bbb7l0bbbbbpqobbl9bbbbbl0jjbbbe7jjjeeees',
  '0000ooo0000v9qv000prplp00e988880eepbruq7pe99qqq0ed99aqg0r9r8j2o0',
  '000000000o0eje00e0ejjjjoe0lq97q0o7qqqguo099r888pro922pvo08qp9p00',
  '007d7do00g44ummv7hummq9v0hgr88r00h4k4l0hfccp9agldll44pol0ogn7o0d',
  '00oo77700o3m3q2o0prmprq70pmmr88gomhb2jo0omqbbj2oorqaq2qo0gpqh290',
  '0007o7000ov999pn7so344ffend94ff0977d9a30dd00dee0gsosgll00oddose0',
  '00o770000gavq7000hupqo000u3rrr7008jso000hifjel00ulfasp00o0hvlo00',
  '0000000007gv000p00pm3uua9a0mommoaa0jmmm3097maaa009qmmam00oma9930',
  '0000n700000shcld000cl11s009ccccl09cb8qi009ccbbbdg9cc8brsloclvsl7',
  '00007770000pq390ee0ala9vrj033aa9a009a900a03a8b909p3a8bo00oaag9v0',
  '0070007007av009000o99pa08007ao30am0ia3e0a9a86880p93r88b00oa93qe0',
  '000o0000000roo0000vo9ql000ep99e0l00eee009e0eb9e9e9oeq9eo7pebpe90',
  '7000n0004nfdkfd07kk4ccf0fnkcdc700ffccec00007cbd00001fl70000c0d00',
  '00000000000oo00000vo9o00009pbb0000999e000l999el0orppqlro0gd0vdv7',
  '007770000ejbpen00jj4klf0qa2997g0ai6il9900cccpa0901llp90o002oov00',
  '000077000e7229e7urhqqou088i88rr0888p888008898lev0iiuhlpv08ggd7p7',
  '0007o7o000pmmm3vuq3m39m3882mqr8o888s8r80088oqe090bbele7p0bo777e7',
  '00ooooo0003mmma0lu4auqp0l8fr88p088hr98q0g888pgp0ouuuofo0opn70o00',
  '0oo007000i8qqpg00quqlqo0cllhrh008hsdnd7009lu8soo0vlhhvo70hsccos0',
  'o9aaa3900vaa3kk009ap4440o4pkk440fkfp4kk0fkkffo0fo4k00e4ffk700nf0',
  '000v9ppo000r888g0ppq8uroorq9qo9o78qu899e0gq899o0o8qjee9ooje00ee7',
  '000d0000007nddd0ppgvdel08qqu9e808rrqqr8v088q98r988hf07l088h1ld90',
  '0008jj80u8088oi0u80ibp8ohi0lb889ohui9lq9000h8p00008m9aa0008000p0',
  '000j2j0000jj8mm000abumupuuqblr0v8qjjloe2097fkfee00hk0f900p00000e',
  '00p999p00098989pgp98quqp8q9q8u8ogrrrq9o000p9909p0gvgggg00h00000l',
  '000p9pp0ppe990909ee9bgq0pplariio09haalpe0a3oe0000a3099009900ee00',
  '0jiin77000n0cdcdpddlt0h78h1qiq8088tr89sp00v99900cccnddd099000ee0',
  '0007ddd00ccd9990olcg9v909pc99o9099lbj992099jjnej0ccdddn0090000e0',
  '000ppps000p9hiho009qhhheuumiihihr8mpello90jjje000ml0d3ll09000e00',
  '00008rp008rp8080p889ug8088qhhr8s888ii9ol08ijje0000jcndd000800090',
  '0000e2ae000jjj7dgggjqep0qbuu8urojr88s88e7hlen7v8jjjede70h00000l0',
  '000jj000ggdejje0lg7ejqq08ugqbph088rppr87088e87ep0vggdd7008000090',
  '00ud770000bhf00000bufo000lbbl400qoebqgso00bbl4e00bbbbse00kkkkkf0',
  '0004f000000km00000fku70000kkun0000kk4f007kkkmud0nkkkffn0vmmmmmv0',
  '0oa999900va8i800073u8hv00o2r8ru7hre92ossi07ee0000oav079o0sho0llo',
  '0007ss0000dr88g00lt0vp0000788rg001cccsdm7ddddn7o01c7dlo0ddd00dd0',
  '0o9o0vo07a9u0rq7oqh7i0oo7aorr8q70sgn7gouohdq700o0oq0l9v0oil07hhg',
  '00oelo000eqhhl000hlho000qa2q8800jhu3aeemjoe2907v0hhgsl00jjj7eee0',
  '000h00s0000ijjj0s00j8ohns70j8888rje6jpe0eje2jje0h70i00l0ej0jj7se',
  '0lhuuul0ihh8780l66h8ii6l000ii8i0ii6hjhl08iihjhll0hicccl007n00dd0',
  '0009e00000dldn0000bdj7007dbjjjhhhibnjjl0iosbjo7007d000d006i000hh',
  '000muu9000mm7m0300mm0m0a0mmmmmma33mmjj03aaomrma900jj0ee00jjj0eee',
  '00lu3u900b8m0m7300mm0m0a7mmmmmma3ammmbmaaaommm3p00sq0ee000bb0eee',
  '0000000000jjje000jjjjje0jji6j88ejj60j08ejj2jjjpejjjjjjeej0jj0jee',
  '0000000000cc1n000ccccc70cc0ic0h7cciichhdccccccsdccccccddc0cc0cdd',
  '00000000003a3p0003aa3a90aai0308paa6ia889aaqma399aaaaaa99a0aa0a9p',
  '0000000000bbbo000bbbbbe0bb60qr8ebb66b08ebbrbblpebbbbbbeeb0bb0bee',
  'll000000bbiiih000i8080000i80800000ii6h000tclsso0b060l0000bb0ee00',
  '0009p0000auccls00alcsc0l00ccdc0l0acahilp02llcccl3jjcii6hclcjbi6e',
  '0009p000o39k4470oakk0fn000kk7fn0o3k34hg0o29kk440ajjkiih04fkj2il0',
  '0obqp0oo00lbbioe68qbbld08ucllle7iqcd0lv0ovllh0000h000h0006u00hl0',
  '0lccccd0dcchtc1001ccc110dcclh889001cl97001ncc8gl0hoc107000jihss0',
  '0p3aaa3o0vr3aa9900pa0a970098iiil0loalls00oa9hhqp0lhl09v0000j8esd',
  '0ejjjj00ejjjjje0jejjj7j0jejjr887jeliq9000jbi88ol000f7fgl00eao9e0',
  '000i8o0000uh8l00vp9ljeoe0v9pape0ejjmjaeehonhdgdh00dndn0000d00700',
  '004kkk00004khf00000hii00000ic0000006c000000cc000006cc000000ii000',
  '000999000up99qe0hh9808008oer8800o8crc0llp0ccl8800899800009000p00',
  '0004kkf0001coc70004kk4kf09kkkbkf99f99900pkfmamf009kaaa0000k00f00',
  '0004kkf00oe9fpn00044k4kf094kffkf99f999009kfmamf002ka3a0000400f00',
  '000kkkf00elufu700744k4kf0pkkkfkf99f9p9002kfmamf009kaaa0000k00f00',
  '000kkkf00p23fmd000kihk4n0pk6iikf99f999009kfmamf002kaaa0000k00f00',
  '09999e00099r99o0p980r0e0998888l700a8plld08maa98008mmm0000060l000',
  '0900e00009vvee00p99097e0999p9pd70ee99pddjejeee00peejjee009000e00',
  '000lljl0000lljl00lllmlm0dnlllll0h0dd707080ldd0d00l000d000d000d00',
  '0aa99ep00vbbpbs00oaqr9plsf2aa9p0ffjglhe0aajj99ep30gvggvp00j000e0',
  '00l007u000lsslr00oll7ur07llllll0llalllo09eaaaae0ll999pd000p00770',
  '00lhhl0007hlllo00hho0rs70hlhhlls0sdeee70elgveesoer0ggoeeeglgggl7',
  '00i000h000hi666000h0g8o0fki88880n14cccc0l4cccccp00ddddd0008000v0',
  '0000000000paaaao0p9iaa9i0pa930p97oa99mq9oaaaaaao799aaaa9009o00o7',
  '00ebbm000bbummm00bbb7i000bbb88800bbb2jb00bbb88b00bbbeeb000ejjj00',
  'dfddddd0nfdkkk70nfd0k7d0dfdkkk70nfddn1df4fdadjl04fdndnd004000f00',
  '007ddd0000ddhdd00ddh0h00dddhhhl00ddlhld0ddhlldl0ddh0d0l007need00',
  '0030303000j3j3j000iccci00diicii0ddinc0idddiic6idcndiii0cdddd60dn',
  '0ejja32000a3a8a0008i08i00080b8b00038i8000q8bbp00000ih000000dd000',
  '0mcmmmc0mmamm8ma00h608i00080c8c000088800008ccp00000ih000000dd000',
  '000ddd00ddd7n8d0dd8i08i00d80k8k000088800008kk900000ih000000dd000',
  '0jjjjjje08dddnn70lcdclnc88lcclcl088ll8b00ir8hqb00eiih6000dd0dd00',
  'mm3ii86pmmmc68c30088r8800009b0000008bb000088i0000000i00000bbbee0',
  '000lhhh000lh6d6h00lllll000lliii00lhhhhh0ddllllldlldd0ddl00ll0ll0',
  '000aaaq0033888000aa8i8i0008888800008ii0000jj8e00088j6ep000ccll00',
  '0esoeeo0eeeeliieee08liieee0o8bb00e08i8i000f48ihp00iddn08000gsdg0',
  '000bb00000b7bd0000bibh00obbeelg0bbbbjll0bbebbb907fklk4f000bbeb70',
  '0mmmmmq004ut6cu0088iik4pikm33au0mci88i8vm799jp2v0f44f3000lhldds0',
  '00g7os0000gdsl00ejecclleggejjjjve2dhllhe7s0gsdgd007d77d007lls0lg',
  '009mmmp0009mump00lgmmmmg0dlamm3v729ccc1v73pnddoa00pm09ao0v8m09aq',
  '00olhl00g0shlh00ghi6siil7l9bhhodghl7ndgldddudl0dg0dn07n00glioghl',
  '000mmm0000mmmmm000mm0m0000m88r8000mr88p00ii66i80umccccna00cc0dd0',
  '01cccd00ccccmm70cccm0m0001mmmmm0000mmm000qmmma30mvkkkf0300jjee00',
  '00mamam000mmmmm000mm0m0000mmmmm000mmmm000jjjjje0q0ccccda00cc0dd0',
  '000mam0000mmmmm00mmm0m0m00mmmmm0000mma0000mjje300m2jjeea000aa900',
  '00000000000mccm000mmmmmm003mm0m000mmmmjj000ammjj00ccc0d00cccmc7a',
  '003aaa00030a6a60000aaaad000a990000aaa3000a39aa003399a9003aa9a900',
  '00000000d00g0g000d0gg0g00d0gmjm0d0cvsgvgdgvcc0000gvgs0000gg0gd00',
  '000ff000000mmm00fffmmmmf0fmm0mj00alm8888aall88r9iikkkffl0jjj0eee',
  '0ejeeje0jjjjjjjjejjjm2mejjjm0m0e000mmmm000mimm000mkfk43009990eee',
  '00cccd000iiccch000ccmm7000cm0m00000mmmm000m6mm000mkfkf3000990ee0',
  '00p99900099mpm0009mmmmmm0bbmmma0bbbbbbb0mmbmmmm0mmdnnd730dd70ds0',
  '009999o000pmmmp0009mi8l000mm99o000pmmmp07f4bb2e0vmffffp000gg0d00',
  '0d7ddd707dg99pd7d7oo0p000vop99v000o99v00ff0oeonnvfpmmmao0nd00dd0',
  '007ddd0007diulg00dd88ii000hr88800lb88880gpqbrmq8001cccc000b000b0',
  '000hhhl000lhhllo0ghhhlhh0hhhlllh0glslev00hlsoggl0gl7ggdd00h600lh',
  '000ddd000dddddd00ddh66d0jjev997ejjjbbjeed000dd0d0dse0dd000770d00',
  '088i6g00088ii600008iio00000i000006ikkh0000hhhh00000be700000i0000',
  '00000kk00470bee00n00kii000f4i00b4fbbbbk04kfmqe00f4kbeif00f4kiikf',
  '00hhl0000d7i870000i880000hh8q000hlhhll0099lli7e0plhhll900ccdcn00',
  '003a9000003880000398890000eje0000ejihe0008ejep0000k0f00000j0e000',
  'i39a390000aii000039aaj30009aaa3000ej0000703aa0000a93a90000393000',
  '00jjj0000jjaaj0000jiij0003cccc0060dnan90600cjc9000939a0000ccdc00',
  '000ll00000hlll00000hhh000lchln00l0nchc70l00djnd0007ldl0000ccdc00',
  '00iaa90000i6a800000ii80006faj900j0ffcfe0j00ccce000liv60000ccdc00',
  '00mm30000mm3p00000mii0000ij8e000i0ejjp00i0eje78000aep00000j0e000',
  '00033000i0a88a000ia88300088cjcp0apc88le980e99e0v0880e8p009p0e9o0',
  '000ccl0000ccr8l000clvol003kaaa9009f429f008e9990e00f4nfe000aao9p0',
  'o2ajj000ojj8800000j8800000a3a000s60iql00g8ihav0000r8900000jje000',
  '0llll0eo00umm0ll0lumm00oncsn0lcfcclccl10c0sll7770ccllclo0lsn7ls7',
  '00dddd0000d6iig000h888g000h888g00hcccch00ugau1h00uqslur000iihqs0',
  '0000000000ummmp000u8iiu000u888l00lq989qg0luoddlv0pq999qg00hiv8q0',
  '0jjejj000jjj88000009r8000000u000000qii0000pi6hr0000ui000000u8000',
  '000cdd0000dd8800000d880000008o000008cc00008cci00000ccn00000i8v00',
  '0000ji000000j8800000e8800000cl00ejo0nj0000j0jnjd00jnjjj000ejjnjd',
  '00099900009988000098ir600008880000aaa0000088ar00000dd000000dd000',
  '00lcll000l888cc00ci8icl00088860000ikkii08ilee8i000ellei000e00e00',
  '000mm000000m80000066ca00006i6a00006066000008cc00000cc00000099e00',
  '000bj00000jj6j00000ef00000eoke8000e6ee000000bb00000i8000000i8000',
  '000ee000000e60000003a000003a3a0000i9a9i0000jj000000i80000009e000',
  '000990000009i000000fi00000ikf00000ikk80000ikk800000je000000je000',
  '00009s0000009p0000009d70000099p00d0ncl000d0epm0000de9s0000e99ep0',
  '007jd0000ddddd000jjjjj00080808000j888j00e9jjj9e0jp9e99j00ddddd00',
  '0fkkkf000kfffk00kkfffkk0k80rl8k00fr8hf009affpap0kaa93ak00nfffd00',
  '00cmul00dcccccd0ommmmmp0v80rrgg0sb8888e0jjjbbjj0rjjjejbo7e999p00',
  '0oaa30000qeeeq00a988i990aepg0990398889900app9a00eaaaaao0n7eeen00',
  '008mmp0000ldn70000mhup00e3388a90ppudsd900hmmmus000r0vp0000h0ol00',
  '00lcl00000sdd000001tl0000l1i0ls0n1lpl0so0ltclhl000snl00000hgh000',
  '00fkf00000ssd00000fl4000fmm83a0040gqq0f006h4fh0000fff00000lll000',
  '00jje70000lnn00000jhe000oje6ne70e0hgl0e00ijjeh0000j0o00000i0ho00',
  '00ggd00000ldd00000ghd000ds76ndd0g7hgl0d00hggdh0000g0700000i0h000',
  '00bbj00000lnn00000bhj000ebjiejn0b0hgl0j006bbbh0000j0j0000060h000',
  'p90090000099m00700r88880009930000909r0000p980ee0e09e00000vpee000',
  '0lcl0dd000lc0d0000cc0aa0000c0c00007dlc00000lcd000000a000000a3p00',
  '0bl0ge000blmlm000llidh0000llh0000llhlg0060lhh0h000ggl000hl60h000',
  '000000000rb90b000b9999000bb96d0000098800e09e90000peaas0000e9o000',
  '000nndd00099ii0009988da09e9866a09p98jj3o00e8i600ee9ia9000pv00e90',
  'hhhl000000hh000000ii8aa000lhl0lf0l0i6ll00ih6i00000h0l0000660hh00',
  '000060a0009aaa90000h000000ddd0000d0dnd000dddd00000pe00000a3pp000',
  'm3fk4000mpk0nf00mfkhli0000k4nf0000jee0a30i02eeh000k4n0000iiohh00',
  '0000n700000hibg00000hl000000ds00000dsh000006dhs0dld70700000hils0',
  '0000000000000000000000000vmmm0000vhum0000om3q00000pg00000v39v000',
  '0vaee2o0099aa9a009m9qr9i09ammmm300qaaa9077paaa700eeaav0009a3a990',
  '0ll0jil07hiijjjoo6iii6b7ohhii7hgo6iq8iig0hi666hgo8jjjjbg0lioi6u0',
  '0399aa000aaa3aa00aaq88000bbq8v0000s888000ejj700008rdp00000gll000',
  '00da6h00003iisd00009680070aai900p09eis00v0iaiqh00q9eao00006i0hh0',
  '00jmmmj000mmr83000mb88000hccbch00jijjje0itccccch0uq8b8a00uvjej30',
  '000999000pf98890099b8r0006kkbkh00fibbbf06kkkkkkh09b8b80000fkfk00',
  '000fff0000ffr8f000fb880006llblt00licccl06llllllh00b8b80000dldl00',
  '000ddd0000nd88d0007b88000ijjbjh00e6esed0ijjjjjjh0db8b8d007ejejd0',
  '00jjmm0000mm88m00mmb8800m6a3bah0m96dddpm6aaaaaah0mb8b8m000939300',
  '000dl7d00dd778d000d88080000n88800088r900080kkf90000d7d0000j00e00',
  '00l00g0000lllg00dd6ldidd0llllgg0lllghdggllghghdg0lhhhhg00llhhlg0',
  '0000d00000dddddddd778dd00d880800e0d8r800eea390800a8dd9900dd000d7',
  '00000000008rb00008800b0008880800r088880009aap0800a3dd9p00dd000d7',
  '00cje0000cjccl000cc8rl000c88u00000ebl00008f9p90000bbq0000087v000',
  '000868p0obejeee0q9982ll0q99eiiiobh8aihh0ehea3iq0oe9aqhp000plld70',
  '0mpejiav0ompno90007lhh000gbjjjo0h7shihl0j0lldl7707so0dd00o9o0so0',
  '00muhl0000mi8ri000imm8900lhii8v0lio22luh007h8ii00eji6uj00hg00006',
  '0ffkk0000p3kjkk700qmr8l70gl4k8l07ulfff4t00dll8lf0ol4kns70ff70s04',
  '00l8m8h00m8imih000pii8m00iir8800i8ulhh660dnlh8t00ccti0c00ih0000i',
  '000bibi000hbfif00bhb8rf00qfhiibbqiffbebb0h0q8qg004kkh4k00b00ho0b',
  '000had3000iia3j000d6p9000lhl6800b8sqhahh000sohbe0ndbbnd00q0e0e0b',
  '0m0eee003maei8e03d3e88000aehv9000i9eiie0eneelhhegdehhile0dh6h6h0',
  '07dd00000ddi00000088000l0jjjjllgjjhie0008esgeee0jpdggs000l00l000',
  '000ddd000008nd00000jjc0000bjbjj008onee09jsdsej00gjedne00000nej00',
  '00lhjh00lhlihilhhiccmccidlpacanlh6ejnjl67lhmbmhl0dihnhi00ejjejj0',
  '000amm00000a8a00000a8a0000eeejj0008eldi007drdd000edje000en0ee000',
  '0000ddd00000r8d0hld088d00n8cljc0000lcjl800ccsesc000dd0dd000d0007',
  '00jjj0000bjee9000je88s000e88i00iejjee2i00jihjsh0076dd0000g000g00',
  '00jffjje000f8r8e0000j880r8kk8k9v00fk4000003a00000ff0000099000000',
  'cc0mu0l0cccmmmmm0cclm8r300cc88800ccukk000c844lr0000rl0000008u000',
  '000mmu0000088mp0or0r88p0g8iilq000000cup000nlllv000c8cs00dc8ncs00',
  '00paaa000oar88000om88r000oq9ep000bqo0vo00rs00sq00sl1dl700elcclo0',
  '00m00po000mmmmv000m3ap0000mmmmo000jjjeo00em2jea00ummmm3000u9ppo0',
  '0070000000l7e00000lro000000r8000000rb000000je00000l2jpo0000lv000',
  '0007d00000dcdl000clcccl00clu88e00lpq88e000dldl007ccclcl0e1ssl1s0',
  '0mamm90097eabbe0903mmme00ae99e00003mmo0090emmoe0papaapo0000e0000',
  '0lm0a00000qm3000000mm00000mmbb00000mii0000mii0000umi87000pu09900',
  '000000000990ee0009999ed000099200000cc00000c9cle00e9ele707pvvvoo0',
  '00900e00009a93000p93m3e000pimi000pe888e09ee88eeep98889000uu0vv00',
  '0clllc00cie8r0c0c0e880c0gh4kkkg0kgb6ijf0i00dd0h00hh0gh000440fnf0',
  '09999000re88pp00308800003388ja00006a60a00099980000cncv0000e0e000',
  '00999p00003988000009880000mmaam0009rmm8000mar8000mmm3a300uuuu990',
  '0000d79d0da979a0dda999e9nnda9898iadnap3d99d736dep0ep7e0o00v00o00',
  '0dcc000000ccc0000cccdla00cccclcc000cccc000jlcc000lc7700000s9v000',
  '000jn000000d0870000n8800088e807ui0oej88000ii6000hhhiii0000000r00',
  '000d1d0000do88d0000388p0000c1000008gqp0000nccc0007dccc00000up000',
  '000nj000000a2v00000780002a0e8o00oadnn000g8eejee079d000l0o9o77700',
  '0l1dnnn009u8r8000s888bbo0nl88p000vmlcl000iejjel000pg0v0007p00o70',
  '000dd000000dd00000d7llv000dhuqvd0000sup0n007nn000787eel000qa9o90',
  '000nd000000j000000eoi7vo0ddho8p00gg7hulg0d0dnnnh00dlbje000va0vp7',
  '00001cl00007hii00000h0i00007uaaa0llcc90s0iittldl00l6hh000qavv990',
  '000000000000jj00000j6i700008oi700go229900hjje00000ijho000pa0pp00',
  '0000000000004k0000046if0000i7io00goup9900h4kf00000hkh00009309p00',
  '000000000000cc00000c6il0000io8o00lduq9900hccl00000ict0000a30p900',
  '000lnd00000jee0000n7n0d0s0lisio0bst29q9ojccjenelihcil00eqj0pe90s',
  '00096aaai00i7id00883aaa37p9aabq7u0vea99e600vee0l0088p9p00gg000d7',
  '009e90000098p8000980ij000v8rii00oe22uq709jajaje009988e00epp0eee0',
  '0d9dd000eeeeeee0e980i0000vrhii00o0ll8l709dddhde009998e00ep90ees0',
  '0bccaab00ba8r3b000380800oaqrr8b0aqqsqh0038aee80003lll00000l07000',
  '0beccb000be99b0000jjee007hr88h00hhlhuds0hhhffdl0phhffsl00990ev00',
  '0j99p00000ir600000880000gj22sog080b80lu0j0jj00p000cd00p007cn00v0',
  '00tct600000ccc00000c8ij0icll2jt2e01hejtj00cl9jcj0cd0olj00j0000e0',
  '000jm900000jm9000000je000oujlpv0ob0qjol0g60mdsh7dc0eo9l007000o00',
  '00ejje00clbbjin0j7ejjs77e0ses7700d1dd7s00d1ddsls0oe000o00oe00o00',
  '007dnf000nknfk70fkff4hg0fkffffn0fkkffnff0g47oddn0g400ff000000000',
  '04od4dn0740n4dnn044ne00n00sh66hf000shnn000f4off007lh0ggl000o0000',
  'hslhgh00h0dhlh0008hqra000vu8v80000eeso8o0j2l99eu0jqleeq000700000',
  '00om0a0000am9a0007mr3ol00n7800cl74f0f0l9qdknfvr0gp3v9o9000000000',
  '0000g8000000880000jcjaj0jj1ccjc0ee8ec17v07oljoo0000ls02000000000',
  '007empjj00jjjmjj0m0ejj880i0jj6e0007mm07rv7eeeje0v770ue0000007000',
  '000d0d00000d7d000007880007llddg0dldllvgddo0su97700ss00s000000000',
  '000guh000008n7000mma8800makjj308mp8h22pp00g49do00glo07o700000000',
  'gff4400060fi6000eeijje0ie0e660e000elb0000ee9e7000g0007o000000000',
  'vvoooeg088p99bb08iii99000ii8890099hhl9908uiihhl0pi8lrbg000o07000',
  'rblhi0gq08bfffb0008feeb00fn0ff00f0fbbd00fnnrl07dn0fsd00000000000',
  '000doo0000079p00gvn79p00gjije000giih7peg9prr2q0079ppvl0000000000',
  '000dgs0000078800gg7n8800gjp4e000vp9envfo9p92p9000ppvvo0000000000',
  '000mmmu0000m8800gg0m8800gj4be000pkksvpbg944uqp000p9vgd0000000000',
  '000a3p00000a8u00ggda8l00ej89e000prr9dpv0pprr2p00o99vvo0000000000',
  '004kko000np4kj0004l6ih000f000n00kfp2j2fnfnf9jj070ffoeo0000000000',
  '00ummp007um88l00ghuhhls10lhtthld0lhiihg00p9pvs70pru0glu70o0000o7',
  '0ff000000f44fod00f4lfls70gl4nhu40gu4nr8louueerq00uloevlo00n00n00',
  '0lsn0000ldlbs0000hhrs0o706iihq70066iib000llho000s6iiho00olllgs00',
  '000999000og98v00glghl0oolgghslr7hpghghh00odddd000o00dd0000000o00',
  '00009e0000o9p8d007lqp7o00o9qo7vd0v99ddp70eepl000p9e0do70ooo007o0',
  '000cl00000htes000lltbso00ihhicl006hiicl00cliico00illlos00ll007s0',
  '00mm00000vmm7000pumm9s00guopv9000m0sdp0000oma00000m3v00000ppp000',
  '00dd000000ool00700sos70d70odod00d0gdd700d00gjjjed0d7000000700000',
  '0l6h00000hgg0000lslls7d7ghllo0000hhl0000s7d00000hg0hs000s00gs000',
  '00dd000000dg87000l08il00usspllooi0gggoss0r8dn8d70lhs0lh00gl00el0',
  '0ddgl6gdoglgddd7oss77000gg00gd70gg00sdd000dod0gs000007ss000007s0',
  '0dnnnn000d0ilo8dolpiili79g8888i090888hi09dv2lds0una2lsu000eed000',
  '079999p0o9999ppo999oqqvo999u88uo99pri88o9v92ldsoud22sdl007ee7000',
  '03aaaaa0ama3q8qaa8mru8lp9q8r88g093888800qn22ldg0ud22sdu000eo0700',
  '0009pv000009iu0000seq900ghsj8bg0giejibl0brbblbp0lll8ll7000slsgo0',
  '0hr8rl00hli8ri000lhuu8000hhhlil00iiihil00ulllhq00orulr7000oooo70',
];
/* Deterministic 7 by 7 pixel portraits: a seed, no uploaded image. */
window.smrAvatar = function (seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return n >>> 0;
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 8 8');
  svg.classList.add('pixel-avatar');
  svg.setAttribute('aria-label', 'Generated avatar');
  svg.setAttribute('role', 'button');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', 'Enlarge avatar');
  const enlarge = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const d = document.createElement('dialog'),
      copy = svg.cloneNode(true),
      close = document.createElement('button');
    copy.removeAttribute('tabindex');
    copy.setAttribute('role', 'img');
    copy.style.cssText =
      'width:100%;height:calc(100% - 48px);min-height:100px;display:block;object-fit:contain';
    close.className = 'icon-button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">close</span>';
    d.className = 'avatar-preview';
    close.onclick = () => d.close();
    d.append(close, copy);
    document.body.append(d);
    d.onclose = () => d.remove();
    d.showModal();
  };
  svg.onclick = enlarge;
  svg.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') enlarge(e);
  };
  if (/^pixels-[0-9a-v]{64}$/.test(String(seed))) {
    const palette = portraitPalette;
    [...seed.slice(7)].forEach((v, i) => {
      if (v === '0') return;
      const r = document.createElementNS(svg.namespaceURI, 'rect');
      r.setAttribute('x', i % 8);
      r.setAttribute('y', Math.floor(i / 8));
      r.setAttribute('width', 1);
      r.setAttribute('height', 1);
      r.setAttribute('fill', palette[parseInt(v, 32)]);
      svg.append(r);
    });
    return svg;
  }
  const colors = ['#1967d2', '#5f6368', '#8ab4f8'];
  const color = colors[next() % colors.length];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 4; x++)
      if (next() % 2) {
        for (const col of new Set([x, 7 - x])) {
          const r = document.createElementNS(svg.namespaceURI, 'rect');
          r.setAttribute('x', col);
          r.setAttribute('y', y);
          r.setAttribute('width', 1);
          r.setAttribute('height', 1);
          r.setAttribute('fill', color);
          svg.append(r);
        }
      }
  return svg;
};
window.setupWebsiteExtras = function ({ state, callServer, requestAccess }) {
  const account = document.querySelector('#activity'),
    summary = document.createElement('section');
  summary.className = 'account-insights';
  account.querySelector('.balance-summary').after(summary);
  const catalogue = document.querySelector('.catalogue-card');
  const lists = document.createElement('section');
  lists.className = 'catalogue-extras';
  catalogue.after(lists);
  let data = null,
    token = '',
    loading = null;
  const overview = document.createElement('div');
  overview.className = 'account-overview';
  account.querySelector('.balance-summary').before(overview);
  overview.append(
    account.querySelector('.balance-summary'),
    account.querySelector('.account-action-card'),
  );
  function arrange() {
    const profile = account.querySelector('#community-profile');
    if (profile && profile.parentElement !== overview) overview.prepend(profile);
  }
  new MutationObserver(arrange).observe(account, { childList: true, subtree: true });
  arrange();
  function render() {
    if (!data) return;
    document.querySelectorAll('#admin-tools [data-extra]').forEach((el) => el.remove());
    summary.replaceChildren();
    const portrait = document.createElement('div');
    portrait.className = 'avatar-settings';
    portrait.append(smrAvatar(data.avatar_seed));
    const change = document.createElement('button');
    change.className = 'tonal-button';
    change.textContent = 'Edit avatar';
    change.onclick = editAvatar;
    portrait.append(change);
    summary.append(portrait);
    const grid = document.createElement('dl');
    grid.className = 'stats-grid';
    const stats = data.stats;
    for (const [label, value] of [
      ['Balance rank', data.coin_rank],
      ['Tasks proposed', stats?.tasks_proposed],
      ['Proposals activated', stats?.tasks_approved],
      ['Files contributed', stats?.contributions],
      ['Reviews', stats?.reviews],
      ['Verified restricted files', data.verified_files],
    ]) {
      const box = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value ?? '—';
      box.append(dt, dd);
      grid.append(box);
    }
    const heading = document.createElement('h2');
    heading.textContent = 'Your activity';
    summary.insertBefore(heading, portrait);
    summary.append(grid);
    if (data.admin) {
      const manage = document.createElement('button');
      manage.className = 'tonal-button';
      manage.textContent = 'External resources';
      manage.onclick = manageResources;
      manage.dataset.extra = '';
      manage.insertAdjacentHTML(
        'afterbegin',
        '<span aria-hidden="true" class="material-symbols-outlined">library_books</span>',
      );
      document.querySelector('#admin-tools').append(manage);
      const admin = document.createElement('dialog');
      admin.className = 'repository-dashboard';
      const launch = document.createElement('button');
      launch.className = 'tonal-button';
      launch.textContent = 'Repository dashboard';
      launch.onclick = () => admin.showModal();
      launch.dataset.extra = '';
      launch.insertAdjacentHTML(
        'afterbegin',
        '<span aria-hidden="true" class="material-symbols-outlined">dashboard</span>',
      );
      document.querySelector('#admin-tools').append(launch);
      const close = document.createElement('button');
      close.className = 'icon-button';
      close.setAttribute('aria-label', 'Close');
      close.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">close</span>';
      close.onclick = () => admin.close();
      admin.append(close);
      const title = document.createElement('h1');
      title.textContent = 'Repository dashboard';
      admin.append(title);
      const p = document.createElement('p');
      p.textContent = `${data.admin.members} members · ${data.admin.active_7_days} active in 7 days · ${data.admin.visits} visits · ${data.admin.messages} messages`;
      const cards = document.createElement('dl');
      cards.className = 'stats-grid';
      for (const [label, val] of Object.entries({
        Members: data.admin.members,
        'Active this week': data.admin.active_7_days,
        Visits: data.admin.visits,
        'Chat messages': data.admin.messages,
        'Catalogue files': data.admin.files,
        Folders: data.admin.folders,
        'Files added this week': data.admin.new_files,
      })) {
        const box = document.createElement('div'),
          dt = document.createElement('dt'),
          dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = val ?? '—';
        box.append(dt, dd);
        cards.append(box);
      }
      admin.append(cards);
      const chart = document.createElement('div');
      chart.className = 'usage-chart';
      chart.setAttribute('role', 'img');
      chart.setAttribute('aria-label', 'Daily active users over the last 14 days');
      const days = data.admin.days || [],
        max = Math.max(1, ...days.map((x) => x.active));
      for (const day of days) {
        const bar = document.createElement('div');
        bar.style.height = Math.max(2, (day.active / max) * 100) + '%';
        bar.title = day.day + ': ' + day.active + ' active users';
        chart.append(bar);
      }
      admin.append(chart);
      const caption = document.createElement('p');
      caption.className = 'dialog-copy';
      caption.textContent = 'Daily active users · last 14 days. Tracking starts with this update.';
      admin.append(caption);
      const table = document.createElement('table');
      table.className = 'usage-table';
      const head = document.createElement('tr');
      for (const text of ['Member', 'Last active', 'Visits']) {
        const th = document.createElement('th');
        th.textContent = text;
        head.append(th);
      }
      table.append(head);
      for (const user of data.admin.users || []) {
        const tr = document.createElement('tr');
        for (const text of [
          user.email,
          new Date(user.last_seen).toLocaleString('en-GB'),
          user.visits,
        ]) {
          const td = document.createElement('td');
          td.textContent = text;
          tr.append(td);
        }
        table.append(tr);
      }
      admin.append(table);
      summary.append(admin);
    }
    const expanded = new Set(
      [...lists.querySelectorAll('details[open]')].map((x) => x.dataset.list),
    );
    lists.replaceChildren();
    for (const [key, title] of [
      ['recent', 'Recently opened'],
      ['additions', 'New additions'],
    ]) {
      const details = document.createElement('details');
      details.dataset.list = key;
      details.open = expanded.has(key);
      const heading = document.createElement('summary');
      heading.textContent = title;
      details.append(heading);
      const cards = document.createElement('div');
      cards.className = 'resource-cards';
      for (const node of (data[key] || []).slice(0, 5)) {
        const a = document.createElement('a');
        a.className = 'resource-card';
        a.href = node.web_url || 'https://drive.google.com/open?id=' + encodeURIComponent(node.id);
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent =
          node.kind === 'folder'
            ? 'folder'
            : /pdf/i.test(node.name)
              ? 'picture_as_pdf'
              : /video|youtube/i.test(node.mime_type || node.web_url || '')
                ? 'video_library'
                : 'description';
        const name = document.createElement('span');
        const parts = node.name
          .replace(/\.[a-z0-9]+$/i, '')
          .split('_')
          .filter(Boolean);
        a.title = node.name;
        a.setAttribute('aria-label', node.name);
        name.textContent = parts.length >= 3 ? parts.slice(2, -1).join(' ') || parts[2] : node.name;
        if (parts.length >= 3) {
          const metadata = document.createElement('span');
          metadata.className = 'resource-metadata';
          const date = parts[0].match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
          metadata.textContent = [
            parts[1],
            parts.length > 3 ? parts.at(-1) : '',
            date
              ? date[3].padStart(2, '0') + '/' + date[2].padStart(2, '0') + '/' + date[1]
              : parts[0],
          ]
            .filter(Boolean)
            .join(' · ');
          name.after(metadata);
          a.append(metadata);
        }
        name.className = 'resource-title';
        if (icon.textContent === 'picture_as_pdf') {
          icon.className = 'pdf-symbol';
          icon.innerHTML =
            '<svg aria-hidden="true" viewBox="0 0 32 32" width="32" height="32"><path d="M6 2h13l7 7v21H6z M19 2v8h7" fill="none" stroke="currentColor" stroke-width="2"/><text x="16" y="23" text-anchor="middle" fill="currentColor" font-size="9" font-family="sans-serif" font-weight="700">PDF</text></svg>';
        }
        a.prepend(icon, name);
        a.onclick = (e) => {
          if (node.kind !== 'folder') {
            e.preventDefault();
            requestAccess(node, true);
          }
        };
        cards.append(a);
      }
      details.append(cards);
      if (!data[key]?.length) {
        const p = document.createElement('p');
        p.textContent =
          key === 'recent'
            ? 'Files you open will appear here.'
            : 'No new files since tracking began.';
        details.append(p);
      }
      lists.append(details);
    }
  }
  function editAvatar() {
    const palette = portraitPalette;
    let pixels = /^pixels-[0-9a-v]{64}$/.test(data.avatar_seed)
        ? data.avatar_seed.slice(7).split('')
        : Array(64).fill('0'),
      color = '1';
    const modal = document.createElement('dialog');
    modal.className = 'account-dialog';
    modal.innerHTML =
      '<div class="dialog-scroll"><div class="dialog-header"><h2>Edit avatar</h2><button class="icon-button" aria-label="Close"><span class="material-symbols-outlined">close</span></button></div><div class="avatar-palette" aria-label="Colours"></div><div class="avatar-editor-grid" aria-label="Pixel canvas"></div><div class="portrait-gallery" aria-label="Portrait choices"></div><div class="portrait-actions"><button class="tonal-button" type="button" data-random>Shuffle portraits</button><button class="text-button" type="button" data-clear>Clear</button><button class="tonal-button" type="button" data-save>Save avatar</button></div><div class="save-track" role="progressbar" aria-label="Saving avatar" hidden></div><p role="status"></p></div>';
    document.body.append(modal);
    modal.querySelector('[aria-label=Close]').onclick = () => modal.close();
    modal.onclose = () => modal.remove();
    const grid = modal.querySelector('.avatar-editor-grid'),
      swatches = modal.querySelector('.avatar-palette');
    palette.forEach((c, i) => {
      const b = document.createElement('button');
      b.style.background = c;
      b.setAttribute('aria-label', i ? 'Colour ' + c : 'Erase');
      b.setAttribute('aria-pressed', String(i === 1));
      if (!i) b.innerHTML = '<span class="material-symbols-outlined">ink_eraser</span>';
      b.onclick = () => {
        color = i.toString(32);
        for (const item of swatches.children) item.setAttribute('aria-pressed', String(item === b));
      };
      swatches.append(b);
    });
    function paint(i) {
      pixels[i] = color;
      grid.children[i].style.background = palette[parseInt(color, 32)];
      grid.children[i].setAttribute(
        'aria-label',
        'Pixel ' +
          (i + 1) +
          ', ' +
          swatches.children[parseInt(color, 32)].getAttribute('aria-label'),
      );
    }
    pixels.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.background = palette[parseInt(v, 32)];
      b.setAttribute('aria-label', 'Pixel ' + (i + 1));
      b.onpointerdown = (e) => {
        e.preventDefault();
        paint(i);
      };
      b.onpointerenter = (e) => {
        if (e.buttons === 1) paint(i);
      };
      b.onkeydown = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          paint(i);
        }
      };
      grid.append(b);
    });
    modal.classList.add('portrait-editor');
    const gallery = modal.querySelector('.portrait-gallery');
    function shuffle() {
      gallery.replaceChildren();
      const pool = [...new Set(portraitPresets)];
      for (let i = 0; i < 12 && pool.length; i++) {
        const [seed] = pool.splice(crypto.getRandomValues(new Uint32Array(1))[0] % pool.length, 1);
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.setAttribute('aria-label', 'Choose portrait ' + (i + 1));
        const picture = smrAvatar('pixels-' + seed).cloneNode(true);
        picture.removeAttribute('tabindex');
        picture.setAttribute('aria-hidden', 'true');
        choice.append(picture);
        choice.onclick = () => {
          pixels = [...seed];
          pixels.forEach((v, i) => (grid.children[i].style.background = palette[parseInt(v, 32)]));
          for (const other of gallery.children)
            other.setAttribute('aria-pressed', String(other === choice));
        };
        gallery.append(choice);
      }
    }
    modal.querySelector('[data-random]').onclick = shuffle;
    shuffle();
    modal.querySelector('[data-clear]').onclick = () => {
      pixels.fill('0');
      for (const b of grid.children) b.style.background = 'transparent';
    };
    modal.querySelector('[data-save]').onclick = async (e) => {
      e.target.disabled = true;
      modal.querySelector('.save-track').hidden = false;
      modal.querySelector('[role=status]').textContent = 'Saving avatar…';
      try {
        data = await callServer('websiteData', {
          operation: 'avatar',
          seed: 'pixels-' + pixels.join(''),
        });
        render();
        modal.close();
      } catch (error) {
        modal.querySelector('[role=status]').textContent = error.message;
      } finally {
        modal.querySelector('.save-track').hidden = true;
        e.target.disabled = false;
      }
    };
    modal.showModal();
  }
  async function manageResources() {
    const modal = document.createElement('dialog');
    modal.className = 'account-dialog';
    modal.innerHTML =
      '<div class="dialog-scroll"><div class="dialog-header"><h2>External resources</h2><button aria-label="Close" class="icon-button">×</button></div><form class="task-form"><label>Name<input name="name" required maxlength="120"></label><label>Find destination<input name="search" type="search"></label><label>Destination<select name="parent" required></select></label><label>Playlist or Drive folder link<input name="url" type="url" required></label><button class="tonal-button">Add resource</button></form><p role="status"></p><div class="resource-list"></div></div>';
    document.body.append(modal);
    modal.querySelector('[aria-label=Close]').onclick = () => modal.close();
    modal.addEventListener('close', () => modal.remove());
    modal.showModal();
    const form = modal.querySelector('form'),
      status = modal.querySelector('[role=status]'),
      list = modal.querySelector('.resource-list');
    function folders() {
      const query = form.elements.search.value.toLowerCase();
      form.elements.parent.replaceChildren();
      for (const n of state.snapshot?.nodes || [])
        if (n.kind === 'folder' && !n.external && n.name.toLowerCase().includes(query)) {
          const o = document.createElement('option');
          o.value = n.id;
          o.textContent = n.name;
          form.elements.parent.append(o);
        }
    }
    folders();
    form.elements.search.oninput = folders;
    function rows(items) {
      list.replaceChildren();
      for (const item of items) {
        const d = document.createElement('details'),
          h = document.createElement('summary'),
          p = document.createElement('p'),
          remove = document.createElement('button');
        h.textContent = item.name;
        p.textContent =
          item.error ||
          'Last checked: ' +
            (item.checked ? new Date(item.checked).toLocaleString('en-GB') : 'Pending');
        remove.textContent = 'Remove';
        remove.className = 'text-button';
        remove.onclick = async () => {
          if (confirm('Remove this resource from the website?')) {
            try {
              rows(await callServer('externalResources', { operation: 'remove', id: item.id }));
            } catch (e) {
              status.textContent = e.message;
            }
          }
        };
        d.append(h, p, remove);
        list.append(d);
      }
    }
    try {
      rows(await callServer('externalResources', {}));
    } catch (e) {
      status.textContent = e.message;
    }
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submit = form.querySelector('button');
      submit.disabled = true;
      try {
        rows(
          await callServer('externalResources', {
            operation: 'add',
            name: form.elements.name.value,
            parent_id: form.elements.parent.value,
            url: form.elements.url.value,
          }),
        );
        status.textContent =
          'Added. Refresh the catalogue to see it; source contents refresh in the background.';
        form.elements.name.value = '';
        form.elements.url.value = '';
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };
  }
  async function load() {
    if (token !== state.token) {
      token = state.token;
      data = null;
      loading = null;
      document.querySelectorAll('#admin-tools [data-extra]').forEach((el) => el.remove());
      summary.replaceChildren();
      lists.replaceChildren();
    }
    if (!token) return;
    if (loading) return loading;
    const current = token;
    loading = callServer('websiteData', {})
      .then((result) => {
        if (current === state.token) {
          data = result;
          render();
        }
      })
      .catch(() => {})
      .finally(() => (loading = null));
    return loading;
  }
  function opened(node) {
    if (!state.token) return;
    const current = state.token;
    callServer('websiteData', { operation: 'opened', file_id: node.id })
      .then((result) => {
        if (current === state.token) {
          data = result;
          render();
        }
      })
      .catch(() => {});
  }
  document.addEventListener('smr-view', () => {
    lists.hidden = document.querySelector('#top').hidden;
  });
  document.addEventListener('smr-identity', () => {
    if (token !== state.token) void load();
  });
  return { load, opened };
};
