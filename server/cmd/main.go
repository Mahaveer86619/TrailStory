package main

import (
	"strings"

	"github.com/Mahaveer86619/TrailStory/pkg/config"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
	"github.com/charmbracelet/log"
)

func main() {
	log.Info("TrailStory starting...")

	// 1. Load Configuration
	config.LoadConfig()
	log.Infof("Storage Driver: %s", config.AppConfig.STORAGE_DRIVER)

	// 2. Initialize Storage Service
	storageService := storage.NewStorageService()
	if err := storageService.Init(); err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// 3. Test Upload Logic
	testContent := "this is a test file content"
	reader := strings.NewReader(testContent)

	log.Info("Testing file upload...")
	key, err := storageService.SaveMedia(
		"test-journey-123",
		"test-checkpoint-456",
		"hello-world.txt",
		reader,
	)

	if err != nil {
		log.Errorf("Upload failed: %v", err)
		return
	}

	// 4. Test URL Generation
	publicURL := storageService.GetPublicURL(key)

	log.Infof("Upload Successful!")
	log.Infof("Storage Key: %s", key)
	log.Infof("Public URL: %s", publicURL)
}
