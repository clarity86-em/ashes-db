import '../src/styles.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Ashes DB · 내 덱',description:'내 계정에 덱을 저장하고 여러 기기에서 이어서 편집하는 Ashes 덱 빌더.'};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ko"><head><meta name="theme-color" content="#253747"/></head><body>{children}</body></html>;
}
