export interface LoginRespose{
    success:boolean;
    message?:string;
}

export interface SignUpResponse extends LoginRespose{

    redirectTo?:string;

}