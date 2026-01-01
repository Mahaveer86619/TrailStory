package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Mahaveer86619/TrailStory/pkg/config"
	"github.com/Mahaveer86619/TrailStory/pkg/db"
	"github.com/Mahaveer86619/TrailStory/pkg/handlers"
	"github.com/Mahaveer86619/TrailStory/pkg/middleware"
	"github.com/Mahaveer86619/TrailStory/pkg/services"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
)

func main() {
	// 1. Core Initialization
	config.LoadConfig()
	db.InitTrailStoryDB()

	tsDB := db.GetTrailStoryDB()
	tsDB.MigrateTables()

	// 2. Service Layer Initialization
	storageSvc := storage.NewStorageService()
	if err := storageSvc.Init(); err != nil {
		log.Fatalf("Failed to init storage: %v", err)
	}

	userSvc := services.NewUserService(storageSvc)
	userHandler := handlers.NewUserHandler(*userSvc)

	journeySvc := services.NewJourneyService(storageSvc)
	journeyHandler := handlers.NewJourneyHandler(journeySvc)

	// 3. Routing
	mux := http.NewServeMux()

	// --- Public Routes ---
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "up"}`)
	})

	// Auth
	mux.HandleFunc("POST /auth/register", userHandler.Register)
	mux.HandleFunc("POST /auth/login", userHandler.Login)
	mux.HandleFunc("POST /auth/refresh", userHandler.RefreshToken)

	// Public Data
	mux.HandleFunc("GET /users", userHandler.ListAll)
	mux.HandleFunc("GET /users/{id}/followers", userHandler.GetFollowers)
	// Optional Auth
	mux.HandleFunc("GET /journeys/{id}", middleware.OptionalAuth(journeyHandler.Get))
	mux.HandleFunc("GET /feed", middleware.OptionalAuth(journeyHandler.ListPublic))

	// --- Protected Routes ---

	// User
	mux.HandleFunc("GET /users/me", middleware.Middleware(userHandler.GetMe))
	mux.HandleFunc("PATCH /users/me", middleware.Middleware(userHandler.UpdateMe))
	mux.HandleFunc("POST /users/me/avatar", middleware.Middleware(userHandler.UploadAvatar))
	mux.HandleFunc("POST /users/follow/{id}", middleware.Middleware(userHandler.Follow))
	mux.HandleFunc("DELETE /users/unfollow/{id}", middleware.Middleware(userHandler.Unfollow))

	// Journey
	mux.HandleFunc("POST /journeys", middleware.Middleware(journeyHandler.Create))
	mux.HandleFunc("GET /journeys", middleware.Middleware(journeyHandler.ListMine))
	mux.HandleFunc("DELETE /journeys/{id}", middleware.Middleware(journeyHandler.Delete))
	mux.HandleFunc("POST /journeys/{id}/checkpoints", middleware.Middleware(journeyHandler.AddCheckpoint))
	mux.HandleFunc("DELETE /checkpoints/{id}", middleware.Middleware(journeyHandler.DeleteCheckpoint))

	// Static File Server (For Local Storage Driver)
	if config.AppConfig.STORAGE_DRIVER == "local" {
		fileServer := http.FileServer(http.Dir(config.AppConfig.STORAGE_PATH))
		mux.Handle("/static/", http.StripPrefix("/static/", fileServer))
	}

	// 4. Start Server
	port := config.AppConfig.PORT
	log.Printf("TrailStory API starting on port %s", port)

	if err := http.ListenAndServe(":"+port, middleware.EnableCORS(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
