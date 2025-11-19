declare module '@paystack/paystack-sdk' {
  export default class Paystack {
    constructor(secretKey: string, options?: { hostname?: string })
    transaction: {
      initialize(data: any): Promise<any>
      verify(reference: string): Promise<any>
    }
    plan: {
      create(data: any): Promise<any>
      fetch(planCode: string): Promise<any>
      update(planCode: string, data: any): Promise<any>
    }
    subscription: {
      create(data: any): Promise<any>
      fetch(subscriptionCode: string): Promise<any>
      list(options?: any): Promise<any>
      enable(data: { code: string; token: string }): Promise<any>
      disable(data: { code: string; token: string }): Promise<any>
    }
    refund: {
      create(data: any): Promise<any>
      retryWithCustomerDetails(refundId: string, data: any): Promise<any>
    }
  }
}

