package db

import (
	"fmt"
	"log"

	"github.com/Mahaveer86619/TrailStory/pkg/config"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/gorm"
	gorm_postgres "gorm.io/driver/postgres"
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
	trailStoryDB.DB, err = gorm.Open(gorm_postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connection established successfully")
}

func GetTrailStoryDB() *TrailStoryDB {
	return trailStoryDB
}

func (tsdb *TrailStoryDB) MigrateTables() {
	sqlDB, err := tsdb.DB.DB()
	if err != nil {
		log.Fatalf("Failed to extract sql.DB: %v", err)
	}

	driver, err := postgres.WithInstance(sqlDB, &postgres.Config{})
	if err != nil {
		log.Fatalf("Failed to create migration driver: %v", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file:///app/trailstory_db/migrations",
		"postgres", driver)
	if err != nil {
		log.Fatalf("Migration initialization failed: %v", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration execution failed: %v", err)
	}

	log.Println("Database migration completed via golang-migrate")
}
