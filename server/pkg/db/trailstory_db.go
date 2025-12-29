package db

import (
	"fmt"
	"log"

	"github.com/Mahaveer86619/TrailStory/pkg/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type TrailStoryDB struct {
	DB *gorm.DB
}

var trailStoryDB = &TrailStoryDB{}

func InitTrailStoryDB(isLocal ...bool) {
	dbHost := config.AppConfig.DB_HOST
	if len(isLocal) > 0 && isLocal[0] {
		dbHost = "localhost"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		dbHost,
		config.AppConfig.DB_USER,
		config.AppConfig.DB_PASSWORD,
		config.AppConfig.DB_NAME,
		config.AppConfig.DB_PORT,
	)

	var err error
	trailStoryDB.DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connection established successfully")
}

func GetTrailStoryDB() *TrailStoryDB {
	return trailStoryDB
}

func (tsdb *TrailStoryDB) MigrateTables() {
	err := tsdb.DB.AutoMigrate(
	// &models.User{},
	)

	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migration completed")
}
