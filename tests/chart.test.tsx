import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {it,expect,vi} from 'vitest';
import {Chart} from '../packages/charts/src/Chart';
const captured=vi.hoisted(()=>({props:{} as any}));
vi.mock('../packages/charts/src/chart-base.js',()=>({BaseChart:(props:any)=>{captured.props=props;return null;}}));
it('emits stable identities for plot and keyboard selection, excluding the target',async()=>{
  const onPointSelect=vi.fn();
  render(<Chart label="Capacity" type="bar" labels={['January','February']} pointIds={['jan','feb']} series={[{id:'team-b',label:'Design',values:[2,null]},{id:'team-a',label:'Engineering',values:[3,4]}]} referenceLine={{label:'Target',value:5}} onPointSelect={onPointSelect} formatValue={value=>`${value} FTE`} />);
  captured.props.onElementClick({datasetIndex:1,index:0});
  expect(onPointSelect).toHaveBeenLastCalledWith({seriesId:'team-a',pointId:'jan',label:'January',value:3});
  captured.props.onElementClick({datasetIndex:2,index:0});
  expect(onPointSelect).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByText('Capacity data'));
  const point=await screen.findByRole('button',{name:'Design, January: 2 FTE'});
  point.focus();
  await userEvent.keyboard('{Enter}');
  expect(onPointSelect).toHaveBeenLastCalledWith({seriesId:'team-b',pointId:'jan',label:'January',value:2});
  expect(screen.queryByRole('button',{name:/Design, February/})).toBeNull();
});
it('keeps target values outside the data stack and does not mutate prepared values',()=>{
  const values=Object.freeze([2,3]);
  render(<Chart label="Capacity" type="area" stacked labels={['Jan','Feb']} series={[{id:'team',label:'Team',values}]} referenceLine={{label:'Target',value:5}} />);
  expect(captured.props.type).toBe('line');
  expect(captured.props.data.datasets[0]).toMatchObject({data:[2,3],fill:true,stack:'values'});
  expect(captured.props.data.datasets[1]).toMatchObject({data:[5,5],fill:false,stack:'target'});
  expect(values).toEqual([2,3]);
});
