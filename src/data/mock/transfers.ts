/**
 * Demo transfer feed. Player names are fictional placeholders, not real transfer news.
 */
export interface Transfer {
  id: number;
  player: string;
  position: string;
  from: string;
  to: string;
  fee: string | 'loan' | 'free';
  date: string;
}

export const mockTransfers: Transfer[] = [
  {
    id: 1,
    player: 'يوسف العمري',
    position: 'جناح أيسر',
    from: 'الشباب',
    to: 'الهلال',
    fee: '12 مليون €',
    date: '13/11',
  },
  {
    id: 2,
    player: 'ماركو ريناتي',
    position: 'وسط مدافع',
    from: 'تورينو',
    to: 'النصر',
    fee: '18 مليون €',
    date: '12/11',
  },
  { id: 3, player: 'سامي بن علي', position: 'حارس مرمى', from: 'الاتفاق', to: 'الاتحاد', fee: 'free', date: '11/11' },
  { id: 4, player: 'لوكاس فيرنر', position: 'قلب دفاع', from: 'فولفسبورغ', to: 'الأهلي', fee: 'loan', date: '10/11' },
  { id: 5, player: 'خالد الحربي', position: 'مهاجم', from: 'القادسية', to: 'الشباب', fee: '6 ملايين €', date: '09/11' },
];
