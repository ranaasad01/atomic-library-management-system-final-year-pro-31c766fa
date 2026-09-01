// Auto-generated from the connected Supabase schema. Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: string
          member_id: string | null
          phone: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          isbn: string | null
          category: string | null
          publisher: string | null
          publication_year: number | null
          total_copies: number
          available_copies: number
          shelf_location: string | null
          description: string | null
          cover_url: string | null
          added_by: string | null
          created_at: string
          updated_at: string
        }
      }
      transactions: {
        Row: {
          id: string
          book_id: string
          user_id: string
          issued_by: string | null
          returned_to: string | null
          issue_date: string
          due_date: string
          return_date: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      fines: {
        Row: {
          id: string
          transaction_id: string
          user_id: string
          overdue_days: number
          amount_per_day: number
          total_amount: number
          is_paid: boolean
          is_waived: boolean
          paid_at: string | null
          waived_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}