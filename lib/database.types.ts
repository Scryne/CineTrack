export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            custom_list_items: {
                Row: {
                    added_at: string | null
                    id: string
                    list_id: string
                    poster_path: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Insert: {
                    added_at?: string | null
                    id?: string
                    list_id: string
                    poster_path?: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Update: {
                    added_at?: string | null
                    id?: string
                    list_id?: string
                    poster_path?: string | null
                    title?: string
                    tmdb_id?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "custom_list_items_list_id_fkey"
                        columns: ["list_id"]
                        referencedRelation: "custom_lists"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "custom_list_items_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            custom_lists: {
                Row: {
                    color: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    user_id: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    user_id: string
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "custom_lists_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            episodes: {
                Row: {
                    episode_number: number
                    id: string
                    season_number: number
                    series_id: string
                    user_id: string
                    watched_at: string | null
                }
                Insert: {
                    episode_number: number
                    id?: string
                    season_number: number
                    series_id: string
                    user_id: string
                    watched_at?: string | null
                }
                Update: {
                    episode_number?: number
                    id?: string
                    season_number?: number
                    series_id?: string
                    user_id?: string
                    watched_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "episodes_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_emoji: string | null
                    cinema_identity: string | null
                    created_at: string | null
                    id: string
                    notification_enabled: boolean | null
                    notification_time: string | null
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    avatar_emoji?: string | null
                    cinema_identity?: string | null
                    created_at?: string | null
                    id: string
                    notification_enabled?: boolean | null
                    notification_time?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_emoji?: string | null
                    cinema_identity?: string | null
                    created_at?: string | null
                    id?: string
                    notification_enabled?: boolean | null
                    notification_time?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ratings: {
                Row: {
                    id: string
                    poster_path: string | null
                    rated_at: string | null
                    rating: number | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Insert: {
                    id?: string
                    poster_path?: string | null
                    rated_at?: string | null
                    rating?: number | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Update: {
                    id?: string
                    poster_path?: string | null
                    rated_at?: string | null
                    rating?: number | null
                    title?: string
                    tmdb_id?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ratings_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            tags: {
                Row: {
                    created_at: string | null
                    id: string
                    tag: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    tag: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    tag?: string
                    tmdb_id?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tags_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            watch_progress: {
                Row: {
                    backdrop_path: string | null
                    duration: number | null
                    episode_number: number | null
                    episode_title: string | null
                    id: string
                    poster_path: string | null
                    progress: number | null
                    season_number: number | null
                    title: string
                    tmdb_id: string
                    total_episodes: number | null
                    type: string
                    updated_at: string | null
                    user_id: string
                    watched_episodes: number | null
                }
                Insert: {
                    backdrop_path?: string | null
                    duration?: number | null
                    episode_number?: number | null
                    episode_title?: string | null
                    id?: string
                    poster_path?: string | null
                    progress?: number | null
                    season_number?: number | null
                    title: string
                    tmdb_id: string
                    total_episodes?: number | null
                    type: string
                    updated_at?: string | null
                    user_id: string
                    watched_episodes?: number | null
                }
                Update: {
                    backdrop_path?: string | null
                    duration?: number | null
                    episode_number?: number | null
                    episode_title?: string | null
                    id?: string
                    poster_path?: string | null
                    progress?: number | null
                    season_number?: number | null
                    title?: string
                    tmdb_id?: string
                    total_episodes?: number | null
                    type?: string
                    updated_at?: string | null
                    user_id?: string
                    watched_episodes?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "watch_progress_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            watched: {
                Row: {
                    id: string
                    poster_path: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                    watched_at: string | null
                }
                Insert: {
                    id?: string
                    poster_path?: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                    watched_at?: string | null
                }
                Update: {
                    id?: string
                    poster_path?: string | null
                    title?: string
                    tmdb_id?: string
                    type?: string
                    user_id?: string
                    watched_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "watched_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            watchlist: {
                Row: {
                    added_at: string | null
                    id: string
                    poster_path: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Insert: {
                    added_at?: string | null
                    id?: string
                    poster_path?: string | null
                    title: string
                    tmdb_id: string
                    type: string
                    user_id: string
                }
                Update: {
                    added_at?: string | null
                    id?: string
                    poster_path?: string | null
                    title?: string
                    tmdb_id?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "watchlist_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
