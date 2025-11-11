export interface TabState {
  uri: string;
  viewColumn?: number;
 selection?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface BranchTabStates {
  [branchName: string]: TabState[];
}