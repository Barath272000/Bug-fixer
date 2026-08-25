export interface TestSummary{total:number;passed:number;failed:number;skipped:number;status:string;}
export function parseGenericTestOutput(stdout:string,stderr:string,exitCode:number):TestSummary{const combined=`${stdout}
${stderr}`;const match=combined.match(/(\d+)\s+tests?.*?(\d+)\s+passed.*?(\d+)\s+failed/i);if(match)return{total:Number(match[1]),passed:Number(match[2]),failed:Number(match[3]),skipped:0,status:exitCode===0?'PASSED':'FAILED'};return{total:exitCode===0?1:1,passed:exitCode===0?1:0,failed:exitCode===0?0:1,skipped:0,status:exitCode===0?'PASSED':'FAILED'};}
